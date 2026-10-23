<?php
/**
 * Kontaktní formulář – Veterinární klinika Hloubětín
 * Odesílá zprávy z webu na e-mail ordinace. Běží na hostingu WEDOS (PHP 8+).
 *
 * Nastavení je v souboru odeslat.config.php (vedle tohoto souboru).
 */

declare(strict_types=1);

$config = [
    'to'        => 'ordinace@veterinahloubetin.cz',
    // Odesílatel musí být adresa na doméně webu (kvůli SPF/DKIM), odpověď jde na e-mail klienta
    'from'      => 'ordinace@veterinahloubetin.cz',
    'from_name' => 'Web Veterina Hloubětín',
    'subject'   => 'Zpráva z webu veterinahloubetin.cz',
    'redirect'  => '/kontakty/',
    // Minimální doba vyplňování formuláře (s) – ochrana proti robotům
    'min_seconds' => 3,
    // Max. počet odeslání z jedné IP za hodinu
    'rate_limit'  => 5,
];
if (is_file(__DIR__ . '/odeslat.config.php')) {
    $config = array_merge($config, (array) require __DIR__ . '/odeslat.config.php');
}

$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function respond(bool $ok, string $error = '', int $code = 200): never
{
    global $wantsJson, $config;
    if ($wantsJson) {
        http_response_code($ok ? 200 : $code);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode(['ok' => $ok, 'error' => $error], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: ' . $config['redirect'] . '?odeslano=' . ($ok ? '1' : '0') . '#napiste-nam', true, 303);
    }
    exit;
}

function field(string $name, int $max): string
{
    $v = trim((string) ($_POST[$name] ?? ''));
    $v = str_replace(["\r\n", "\r"], "\n", $v);
    $v = preg_replace('/[^\P{C}\n\t]/u', '', $v) ?? '';
    return mb_substr($v, 0, $max);
}

function oneLine(string $v): string
{
    return trim(preg_replace('/[\r\n]+/', ' ', $v) ?? '');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST', true, 405);
    respond(false, 'Nepovolená metoda.', 405);
}

// Kontrola původu požadavku (jen z vlastního webu)
$origin = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && $host !== '' && parse_url($origin, PHP_URL_HOST) !== $host) {
    respond(false, 'Neplatný požadavek.', 403);
}

// Ochrana proti robotům: skryté pole + minimální doba vyplňování
if (field('web', 200) !== '') {
    respond(true); // tváříme se, že vše proběhlo
}
$ts = (int) ($_POST['ts'] ?? 0);
if ($ts > 0 && (time() - $ts) < (int) $config['min_seconds']) {
    respond(false, 'Formulář byl odeslán příliš rychle, zkuste to prosím znovu.', 429);
}

// Omezení počtu odeslání z jedné IP adresy
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateDir = sys_get_temp_dir() . '/vh-form';
if (!is_dir($rateDir)) {
    @mkdir($rateDir, 0700, true);
}
$rateFile = $rateDir . '/' . hash('sha256', $ip) . '.json';
$hits = [];
if (is_file($rateFile)) {
    $hits = array_filter((array) json_decode((string) file_get_contents($rateFile), true), fn ($t) => $t > time() - 3600);
}
if (count($hits) >= (int) $config['rate_limit']) {
    respond(false, 'Odeslali jste příliš mnoho zpráv. Zkuste to prosím později nebo nám zavolejte.', 429);
}

$jmeno   = oneLine(field('jmeno', 120));
$email   = oneLine(field('email', 160));
$telefon = oneLine(field('telefon', 40));
$zvire   = oneLine(field('zvire', 120));
$zprava  = field('zprava', 5000);
$zdroj   = oneLine(field('zdroj', 40));
$souhlas = ($_POST['souhlas'] ?? '') === '1';

$errors = [];
if ($jmeno === '') $errors[] = 'jméno';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'platný e-mail';
if (mb_strlen($zprava) < 2) $errors[] = 'zprávu';
if (!$souhlas) $errors[] = 'souhlas se zpracováním osobních údajů';
if ($telefon !== '' && !preg_match('/^[0-9 +()\/.-]{6,40}$/', $telefon)) $errors[] = 'platné telefonní číslo';
if ($errors) {
    respond(false, 'Vyplňte prosím: ' . implode(', ', $errors) . '.', 422);
}

$body  = "Nová zpráva z kontaktního formuláře na webu\n";
$body .= str_repeat('=', 46) . "\n\n";
$body .= "Jméno:    {$jmeno}\n";
$body .= "E-mail:   {$email}\n";
$body .= 'Telefon:  ' . ($telefon !== '' ? $telefon : '—') . "\n";
$body .= 'Zvíře:    ' . ($zvire !== '' ? $zvire : '—') . "\n\n";
$body .= "Zpráva:\n{$zprava}\n\n";
$body .= str_repeat('-', 46) . "\n";
$body .= 'Odesláno: ' . date('j. n. Y H:i') . " · stránka: {$zdroj}\n";
$body .= "Souhlas se zpracováním osobních údajů: ano\n";

$encode = fn (string $s) => '=?UTF-8?B?' . base64_encode($s) . '?=';
$subject = $config['subject'] . ($jmeno !== '' ? ' – ' . $jmeno : '');

$headers = [
    'From: ' . $encode($config['from_name']) . ' <' . $config['from'] . '>',
    'Reply-To: ' . $encode($jmeno) . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: veterinahloubetin.cz',
];

$sent = mail(
    $config['to'],
    $encode($subject),
    $body,
    implode("\r\n", $headers),
    '-f' . $config['from']
);

if (!$sent) {
    error_log('[kontaktni-formular] mail() selhal pro ' . $email);
    respond(false, 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu nebo nám zavolejte.', 500);
}

$hits[] = time();
@file_put_contents($rateFile, json_encode(array_values($hits)), LOCK_EX);

respond(true);
