<?php
// Desactivar errores para producción (mejor rendimiento)
// Para debug: descomenta las siguientes líneas
// error_reporting(E_ALL);
// ini_set('display_errors', 1);
error_reporting(0);
ini_set('display_errors', 0);

// Establecer header JSON desde el principio
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Sistema de caché
function getCacheKey($tmdbId, $season = null, $episode = null) {
    if ($season && $episode) {
        return "cuevana_{$tmdbId}_{$season}_{$episode}";
    }
    return "cuevana_{$tmdbId}";
}

// Rate limiting simple para evitar demasiadas peticiones simultáneas
function checkRateLimit($identifier, $maxRequests = 10, $window = 60) {
    $rateLimitFile = __DIR__ . '/cache/ratelimit_' . md5($identifier) . '.json';
    
    if (!file_exists($rateLimitFile)) {
        $data = [
            'count' => 1,
            'window_start' => time()
        ];
        @file_put_contents($rateLimitFile, json_encode($data));
        return true;
    }
    
    $data = json_decode(file_get_contents($rateLimitFile), true);
    $now = time();
    
    // Si la ventana expiró, reiniciar
    if ($now - $data['window_start'] > $window) {
        $data = [
            'count' => 1,
            'window_start' => $now
        ];
        @file_put_contents($rateLimitFile, json_encode($data));
        return true;
    }
    
    // Si alcanzó el límite, bloquear
    if ($data['count'] >= $maxRequests) {
        return false;
    }
    
    // Incrementar contador
    $data['count']++;
    @file_put_contents($rateLimitFile, json_encode($data));
    return true;
}

function getCacheFile($key) {
    return __DIR__ . '/cache/' . $key . '.json';
}

function getCache($key, $maxAge = 1296000) { // 15 días = 1296000 segundos
    $cacheFile = getCacheFile($key);
    
    if (!file_exists($cacheFile)) {
        return null;
    }
    
    $cacheData = json_decode(file_get_contents($cacheFile), true);
    
    // Verificar si el caché ha expirado
    if ($cacheData) {
        $age = time() - $cacheData['timestamp'];
        if ($age > $maxAge) {
            @unlink($cacheFile); // Eliminar caché expirado
            return null;
        }
    }
    
    return $cacheData['data'];
}

function setCache($key, $data) {
    $cacheDir = __DIR__ . '/cache';
    
    // Crear directorio de caché si no existe (Windows compatible)
    if (!is_dir($cacheDir)) {
        $result = @mkdir($cacheDir, true);
        if (!$result) {
            // Intentar sin permisos explícitos en Windows
            $result = mkdir($cacheDir);
            if (!$result) {
                // Log error si está activo
                if (error_reporting() !== 0) {
                    error_log("setCache: Failed to create cache directory: " . $cacheDir);
                }
                return false;
            }
        }
    }
    
    // Verificar que el directorio sea escribible
    if (!is_writable($cacheDir)) {
        if (error_reporting() !== 0) {
            error_log("setCache: Cache directory not writable: " . $cacheDir);
        }
        return false;
    }
    
    $cacheFile = getCacheFile($key);
    $cacheData = [
        'timestamp' => time(),
        'data' => $data
    ];
    
    $jsonData = json_encode($cacheData);
    
    // Intentar escribir sin LOCK_EX primero (más compatible con Windows)
    $result = file_put_contents($cacheFile, $jsonData);
    
    // Si falla, intentar con LOCK_EX
    if ($result === false) {
        $result = file_put_contents($cacheFile, $jsonData, LOCK_EX);
    }
    
    if ($result === false && error_reporting() !== 0) {
        error_log("setCache: Failed to write cache file: " . $cacheFile);
        error_log("setCache: Directory writable: " . (is_writable($cacheDir) ? 'yes' : 'no'));
    }
    
    return $result !== false;
}

function cleanExpiredCache() {
    $cacheDir = __DIR__ . '/cache';
    $maxAge = 1296000; // 15 días
    
    if (!is_dir($cacheDir)) {
        return;
    }
    
    $files = glob($cacheDir . '/*.json');
    foreach ($files as $file) {
        if (time() - filemtime($file) > $maxAge) {
            unlink($file);
        }
    }
}

// Función para hacer peticiones HTTP con timeout corto (optimizado para workers)
function makeRequest($url, $timeout = 5) {
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_CONNECTTIMEOUT => 3, // Timeout de conexión más corto
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 2,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        CURLOPT_ENCODING => 'gzip, deflate',
        CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    return [
        'content' => $response,
        'http_code' => $httpCode,
        'error' => $error
    ];
}

// Función para buscar en TMDB (prioridad: es-MX → en-US → es-ES)
function searchTMDB($tmdbId, $apiKey, $isSeries = false) {
    $endpoint = $isSeries ? 'tv' : 'movie';
    $languages = ['es-MX', 'en-US', 'es-ES']; // Orden de prioridad
    
    foreach ($languages as $lang) {
        $url = "https://api.themoviedb.org/3/{$endpoint}/{$tmdbId}?api_key={$apiKey}&language={$lang}";
        $response = @file_get_contents($url);
        
        if ($response) {
            $data = json_decode($response, true);
            if ($data && isset($data[$isSeries ? 'name' : 'title'])) {
                return [
                    'type' => $isSeries ? 'tv' : 'movie',
                    'title' => $data[$isSeries ? 'name' : 'title'],
                    'original_title' => $data[$isSeries ? 'original_name' : 'original_title'] ?? null,
                    'imdb_id' => $data['imdb_id'] ?? null
                ];
            }
        }
    }
    
    return null;
}

// Función para extraer nombre del servidor de una URL
function extractServerNameFromUrl($url) {
    $domain = parse_url($url, PHP_URL_HOST);
    if ($domain) {
        $domainParts = explode('.', $domain);
        if (count($domainParts) >= 2) {
            $serverName = $domainParts[0];
            $allowedServers = ['streamwish', 'vidhidepro', 'voe', 'filelions', 'doodstream'];
            if (in_array($serverName, $allowedServers)) {
                return $serverName;
            }
        }
    }
    
    $patterns = [
        '/streamwish\.to/i' => 'streamwish',
        '/vidhidepro\.com/i' => 'vidhidepro',
        '/voe\.sx/i' => 'voe',
        '/filelions\./i' => 'filelions',
        '/doodstream\./i' => 'doodstream'
    ];
    
    foreach ($patterns as $pattern => $name) {
        if (preg_match($pattern, $url)) {
            return $name;
        }
    }
    
    return 'not_allowed';
}

// Función para extraer URLs reales de los players con caché persistente
function extractRealPlayerUrl($playerUrl) {
    $cacheKey = 'player_' . md5($playerUrl);
    
    // Intentar obtener del caché persistente (15 días)
    $cachedUrl = getCache($cacheKey, 1296000);
    if ($cachedUrl !== null) {
        return $cachedUrl;
    }
    
    // Hacer petición con timeout corto
    $result = makeRequest($playerUrl, 3);
    
    if ($result['http_code'] === 200 && $result['content']) {
        $playerHtml = $result['content'];
        
        // Patrones rápidos
        $patterns = [
            '/var url = [\'"](https?:\/\/[^\'"]+)[\'"]/',
            '/["\']((?:https?:\/\/)?(?:streamwish|vidhidepro|voe|filelions|doodstream)\.[^"\']+["\']/',
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $playerHtml, $matches)) {
                $realUrl = $matches[1];
                if (!preg_match('/^https?:\/\//', $realUrl)) {
                    $realUrl = 'https://' . $realUrl;
                }
                
                // Guardar en caché persistente
                setCache($cacheKey, $realUrl);
                return $realUrl;
            }
        }
        
        // Búsqueda rápida para dominios permitidos
        if (preg_match('/https?:\/\/[^\s\'"]+\.(?:streamwish|vidhidepro|voe|filelions|doodstream)\.[^\s\'"]+/', $playerHtml, $matches)) {
            $realUrl = $matches[0];
            setCache($cacheKey, $realUrl);
            return $realUrl;
        }
    }
    
    // Si falla, cachear la URL original para no reintentar
    setCache($cacheKey, $playerUrl);
    return $playerUrl;
}

// Función para extraer embeds del HTML de cuevana8 (optimizada)
function extractEmbeds($html) {
    $embeds = [];
    
    // Buscar sección de Español Latino
    if (preg_match('/<span>Español Latino.*?<\/span>(.*?)<\/ul>/s', $html, $langMatch)) {
        $latinoSection = $langMatch[1];
        
        if (preg_match_all('/data-tr="([^"]*)"/', $latinoSection, $dataTrMatches)) {
            foreach ($dataTrMatches[1] as $embedUrl) {
                $realUrl = extractRealPlayerUrl($embedUrl);
                $autoServerName = extractServerNameFromUrl($realUrl);
                
                if ($autoServerName !== 'not_allowed') {
                    $embeds['latino'][$autoServerName] = $realUrl;
                }
            }
        }
    }
    
    // Buscar sección de Español
    if (preg_match('/<span>Español <span>.*?<\/span>(.*?)<\/ul>/s', $html, $langMatch)) {
        $espanolSection = $langMatch[1];
        
        if (preg_match_all('/data-tr="([^"]*)"/', $espanolSection, $dataTrMatches)) {
            foreach ($dataTrMatches[1] as $embedUrl) {
                $realUrl = extractRealPlayerUrl($embedUrl);
                $autoServerName = extractServerNameFromUrl($realUrl);
                
                if ($autoServerName !== 'not_allowed') {
                    $embeds['espanol'][$autoServerName] = $realUrl;
                }
            }
        }
    }
    
    // Buscar sección de Subtitulado
    if (preg_match('/Subtitulado.*?<\/span>(.*?)<\/ul>/s', $html, $langMatch)) {
        $subSection = $langMatch[1];
        
        if (preg_match_all('/data-tr="([^"]*)"/', $subSection, $dataTrMatches)) {
            foreach ($dataTrMatches[1] as $embedUrl) {
                $realUrl = extractRealPlayerUrl($embedUrl);
                $autoServerName = extractServerNameFromUrl($realUrl);
                
                if ($autoServerName !== 'not_allowed') {
                    $embeds['subtitulado'][$autoServerName] = $realUrl;
                }
            }
        }
    }
    
    return $embeds;
}

try {
    // Limpiar caché expirado aleatoriamente (1% de las veces)
    if (rand(1, 100) === 1) {
        cleanExpiredCache();
    }
    
    // Obtener parámetros
    $tmdbId = $_GET['id'] ?? null;
    $season = $_GET['season'] ?? null;
    $episode = $_GET['episode'] ?? null;
    $directUrl = $_GET['url'] ?? null; // Nuevo parámetro para URL directa
    $debug = $_GET['debug'] ?? null;
    $debugCache = $_GET['debug_cache'] ?? null; // Nuevo parámetro para debug de cache
    $clearCache = $_GET['clear_cache'] ?? null; // Parámetro para limpiar cache
    $testWrite = $_GET['test_write'] ?? null; // Parámetro para probar escritura

    // Test de escritura en cache
    if ($testWrite) {
        $cacheDir = __DIR__ . '/cache';
        $testFile = $cacheDir . '/test_write.json';
        $testData = ['test' => true, 'time' => time()];
        
        echo json_encode([
            'cache_dir' => $cacheDir,
            'cache_dir_exists' => is_dir($cacheDir),
            'cache_dir_writable' => is_writable($cacheDir),
            'test_file' => $testFile,
            'writing' => true
        ], JSON_PRETTY_PRINT);
        
        // Intentar crear directorio si no existe
        if (!is_dir($cacheDir)) {
            echo json_encode(['step' => 'creating_dir'], JSON_PRETTY_PRINT);
            mkdir($cacheDir, 0755, true);
        }
        
        // Intentar escribir
        $result = file_put_contents($testFile, json_encode($testData));
        
        echo json_encode([
            'write_result' => $result !== false,
            'write_bytes' => $result,
            'file_exists_after' => file_exists($testFile),
            'file_readable' => is_readable($testFile)
        ], JSON_PRETTY_PRINT);
        
        // Leer para verificar
        if (file_exists($testFile)) {
            $readData = json_decode(file_get_contents($testFile), true);
            echo json_encode(['read_data' => $readData], JSON_PRETTY_PRINT);
            unlink($testFile); // Limpiar test file
        }
        
        exit;
    }

    // Si se solicita limpiar cache
    if ($clearCache) {
        $cacheDir = __DIR__ . '/cache';
        if (is_dir($cacheDir)) {
            $files = glob($cacheDir . '/*.json');
            foreach ($files as $file) {
                unlink($file);
            }
            echo json_encode(['message' => 'Cache cleared successfully']);
            exit;
        }
    }

    // Prioridad 1: Si hay URL directa, usarla
    if ($directUrl) {
        $cuevanaUrl = $directUrl;
        $tmdbData = [
            'type' => 'unknown',
            'title' => 'Direct URL Test',
            'original_title' => 'Direct URL Test',
            'imdb_id' => null
        ];
        $cacheKey = 'direct_url_' . md5($directUrl); // Definir cacheKey para URL directa
    } else {
        // Prioridad 2: Si no hay URL directa, usar TMDB
        if (!$tmdbId) {
            echo json_encode(['error' => 'Falta parámetro: id o url']);
            exit;
        }

        // Determinar si es película o serie
        $isMovie = ($season === null && $episode === null);

        if (!$isMovie) {
            if (!$season) {
                echo json_encode(['error' => 'Falta parámetro: season']);
                exit;
            }
            if (!$episode) {
                echo json_encode(['error' => 'Falta parámetro: episode']);
                exit;
            }
        }

        // Generar clave de caché
        $cacheKey = getCacheKey($tmdbId, $season, $episode);
        
        // Rate limiting: verificar si no se excede el límite de peticiones
        $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        if (!checkRateLimit($clientIp, 20, 60)) {
            echo json_encode(['error' => 'Too many requests. Please try again later.']);
            exit;
        }
        
        // Intentar obtener del caché (excepto en modo debug o debug_cache)
        if (!$debug && !$debugCache) {
            $cachedData = getCache($cacheKey);
            if ($cachedData !== null) {
                if ($debugCache) {
                    echo json_encode([
                        'debug_cache' => true,
                        'message' => 'Using cached data',
                        'cache_key' => $cacheKey,
                        'cached_data' => $cachedData
                    ], JSON_PRETTY_PRINT);
                    exit;
                }
                echo json_encode($cachedData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
                exit;
            }
        }

        // API Key de TMDB
        $apiKey = '05902896074695709d7763505bb88b4d';

        // Buscar en TMDB
        $isSeries = ($season !== null && $episode !== null);
        $tmdbData = searchTMDB($tmdbId, $apiKey, $isSeries);
        
        
        if (!$tmdbData) {
            echo json_encode(['error' => 'No se encontró información en TMDB para el ID: ' . $tmdbId]);
            exit;
        }

        // Forzar tipo a 'tv' si hay season y episode (priorizar parámetros)
        if ($season !== null && $episode !== null) {
            $tmdbData['type'] = 'tv';
        }

        // 2. Generar URL de cuevana usando TMDB
        $slug = generateSlug($tmdbData['title']);
        
        // Mapeo manual para títulos específicos que no coinciden con cuevana
        $titleMapping = [
            'Strip for Me' => 'ella-era-bonita',
            // Agregar más mapeos según sea necesario
        ];
        
        // Si el título está en el mapeo, usar el slug mapeado
        if (isset($titleMapping[$tmdbData['title']])) {
            $slug = $titleMapping[$tmdbData['title']];
        }
        
        
        if ($tmdbData['type'] === 'movie') {
            // Para películas: /pelicula/{tmdb_id}/{slug}/
            $cuevanaUrl = "https://poseidonhd2.co/pelicula/{$tmdbId}/{$slug}";
        } else {
            // Para series: /serie/{tmdb_id}/{slug}/temporada/{season}/episodio/{episode}/
            $cuevanaUrl = "https://poseidonhd2.co/serie/{$tmdbId}/{$slug}/temporada/{$season}/episodio/{$episode}";
        }
    }

    // Debug mode
    if ($debug) {
        echo json_encode([
            'debug' => true,
            'tmdb_data' => $tmdbData,
            'generated_url' => $cuevanaUrl,
            'tmdb_id' => $tmdbId,
            'is_movie' => ($season === null && $episode === null),
            'season' => $season,
            'episode' => $episode,
            'message' => 'URL generada, extrayendo embeds...'
        ], JSON_PRETTY_PRINT);
        exit;
    }

    // 3. Obtener HTML de la URL directa
    $result = makeRequest($cuevanaUrl);

    // Manejo mejorado de errores de timeout
    if ($result['error'] && (strpos($result['error'], 'timeout') !== false || strpos($result['error'], 'timed out') !== false)) {
        // En caso de timeout, devolver respuesta vacía sin mostrar error
        $response = [
            'tmdb_id' => (string)$tmdbId,
            'imdb_id' => $tmdbData['imdb_id'],
            'type' => $tmdbData['type']
        ];
        
        if ($tmdbData['type'] === 'tv' && $season !== null && $episode !== null) {
            $response["season"] = (int)$season;
            $response["episode"] = (int)$episode;
        }
        
        $response["embeds"] = []; // Embeds vacíos por timeout
        
        echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($result['error']) {
        echo json_encode([
            'error' => 'Error en cURL',
            'curl_error' => $result['error'],
            'url' => $cuevanaUrl
        ]);
        exit;
    }

    if ($result['http_code'] !== 200) {
        echo json_encode([
            'error' => 'URL no encontrada',
            'http_code' => $result['http_code'],
            'url' => $cuevanaUrl
        ]);
        exit;
    }

    $html = $result['content'];

    // 4. Extraer embeds
    $embeds = extractEmbeds($html);

    // 5. Construir respuesta estándar
    $response = [
        'tmdb_id' => (string)$tmdbId,
        'imdb_id' => $tmdbData['imdb_id'],
        'type' => $tmdbData['type']
    ];

    // Agregar season y episode solo si es serie
    if ($tmdbData['type'] === 'tv' && $season !== null && $episode !== null) {
        $response["season"] = (int)$season;
        $response["episode"] = (int)$episode;
    }

    // Agregar embeds organizados (solo idiomas con contenido)
    $response["embeds"] = [];
    foreach ($embeds as $language => $servers) {
        if (!empty($servers)) {
            // Para series, si hay latino y español, solo mostrar latino (son iguales)
            if ($tmdbData['type'] === 'tv' && $language === 'espanol' && isset($embeds['latino'])) {
                // Omitir español en series para evitar duplicados
                continue;
            }
            $response["embeds"][$language] = $servers;
        }
    }

    // Guardar en caché si no es modo debug
    if (!$debug && !$debugCache) {
        $cacheSaved = setCache($cacheKey, $response);
        // Si está en modo debug_cache, mostrar resultado
        if ($debugCache) {
            echo json_encode([
                'debug_cache' => true,
                'message' => 'Cache save attempt',
                'cache_key' => $cacheKey,
                'cache_saved' => $cacheSaved,
                'cache_dir' => __DIR__ . '/cache',
                'cache_dir_exists' => is_dir(__DIR__ . '/cache'),
                'cache_dir_writable' => is_writable(__DIR__ . '/cache')
            ], JSON_PRETTY_PRINT);
            exit;
        }
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    echo json_encode([
        'error' => 'Exception caught',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
} catch (Error $e) {
    echo json_encode([
        'error' => 'Error caught',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}

// Función para generar slug
function generateSlug($title) {
    // Convertir a minúsculas
    $slug = strtolower($title);
    
    // Reemplazar caracteres especiales y acentos
    $slug = str_replace(['á', 'à', 'ä', 'â', 'ã', 'å'], 'a', $slug);
    $slug = str_replace(['é', 'è', 'ë', 'ê'], 'e', $slug);
    $slug = str_replace(['í', 'ì', 'ï', 'î'], 'i', $slug);
    $slug = str_replace(['ó', 'ò', 'ö', 'ô', 'õ', 'ø'], 'o', $slug);
    $slug = str_replace(['ú', 'ù', 'ü', 'û'], 'u', $slug);
    $slug = str_replace(['ñ'], 'n', $slug);
    $slug = str_replace(['ç'], 'c', $slug);
    
    // Reemplazar caracteres especiales
    $slug = str_replace([': ', '; ', '! ', '? ', ', ', '. ', '/ ', '\\ ', '(', ')', '[', ']', '{', '}', '|'], '-', $slug);
    $slug = str_replace(['. ', '  ', '   '], '-', $slug);
    
    // Reemplazar caracteres no alfanuméricos con guiones (excepto guiones existentes)
    $slug = preg_replace('/[^a-z0-9\-]+/', '-', $slug);
    
    // Convertir múltiples espacios a un solo guion
    $slug = preg_replace('/\s+/', '-', $slug);
    
    // Convertir múltiples guiones a un solo guion
    $slug = preg_replace('/-+/', '-', $slug);
    
    // Limpiar guiones al inicio y final
    $slug = trim($slug, '-');
    
    return $slug;
}
?>
