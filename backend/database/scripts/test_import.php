<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost/api/products/import");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, [
    'file' => new CURLFile(__DIR__ . '/sample_products.xlsx')
]);
$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>
