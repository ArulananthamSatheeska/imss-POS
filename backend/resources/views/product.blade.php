<!DOCTYPE html>
<html>
<head>
    <title>Product Barcode</title>
</head>
<body>
    <h1>{{ $product->product_name }}</h1>
    <img src="{{ url('/barcode/' . $product->id) }}" alt="Barcode">
</body>
</html>