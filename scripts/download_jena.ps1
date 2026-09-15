$zipUrl = "https://storage.googleapis.com/tensorflow/tf-keras-datasets/jena_climate_2009_2016.csv.zip"
$destZip = "d:\sih ps-2\data\raw\benchmarks\jena_climate_2009_2016.zip"
$destDir = "d:\sih ps-2\data\raw\benchmarks\"

Write-Host "Downloading Jena Climate benchmark zip..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $zipUrl -OutFile $destZip
Write-Host "Extracting Jena Climate benchmark CSV..."
Expand-Archive -Path $destZip -DestinationPath $destDir -Force
Remove-Item $destZip -Force
Write-Host "Done! Extracted contents:"
Get-ChildItem $destDir
