<?php
// msc_unzip.php - Powered by the MSC Media Engine
$zipFile = 'final_deploy.zip';
$extractTo = './';

if (file_exists($zipFile)) {
    $zip = new ZipArchive;
    if ($zip->open($zipFile) === TRUE) {
        $zip->extractTo($extractTo);
        $zip->close();
        echo "Deployment successful: Project extracted.";
    } else {
        echo "Failed to open $zipFile";
    }
} else {
    echo "Zip file not found.";
}
?>