Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\Administrator\Desktop\All projects\Iqbal Tailoring\icons\iqbal_logo.jpg"
$iconsDir = "c:\Users\Administrator\Desktop\All projects\Iqbal Tailoring\icons"

$srcImage = [System.Drawing.Image]::FromFile($srcPath)

function Generate-Icon($targetPath, $size, $paddingPercent) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bitmap)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Fill white background
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillRectangle($brush, 0, 0, $size, $size)

    # Calculate dimensions keeping aspect ratio
    $pad = [int]($size * $paddingPercent)
    $drawAreaSize = $size - (2 * $pad)
    
    $srcW = $srcImage.Width
    $srcH = $srcImage.Height

    $ratio = [Math]::Min($drawAreaSize / $srcW, $drawAreaSize / $srcH)
    $destW = [int]($srcW * $ratio)
    $destH = [int]($srcH * $ratio)
    $destX = [int](($size - $destW) / 2)
    $destY = [int](($size - $destH) / 2)

    $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $destW, $destH)
    $g.DrawImage($srcImage, $destRect, 0, 0, $srcW, $srcH, [System.Drawing.GraphicsUnit]::Pixel)

    $g.Dispose()
    $bitmap.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
    Write-Output "Generated: $targetPath ($size x $size)"
}

Generate-Icon "$iconsDir\icon-192.png" 192 0.05
Generate-Icon "$iconsDir\icon-512.png" 512 0.05
Generate-Icon "$iconsDir\icon-maskable-512.png" 512 0.15
Generate-Icon "$iconsDir\apple-touch-icon-180.png" 180 0.05
Generate-Icon "$iconsDir\favicon-64.png" 64 0.02
Generate-Icon "$iconsDir\favicon-32.png" 32 0.02

$srcImage.Dispose()
Write-Output "All icons generated successfully!"
