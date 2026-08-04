# Генерирует иконку приложения: розовая книга в розовом скруглённом квадрате.
# Результаты: frontend/public/favicon.png (256x256) и frontend/public/icon.ico
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'frontend\public'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$size = 256
$bitmap = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bitmap)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::Transparent)

function New-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = 2 * $r
    $p.AddArc($x, $y, $d, $d, 180, 90)
    $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $p.CloseFigure()
    return $p
}

# --- Фон: розовый скруглённый квадрат с градиентом ---
$bgRect = New-Object System.Drawing.RectangleF(10, 10, 236, 236)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $bgRect,
    [System.Drawing.ColorTranslator]::FromHtml('#FFB7CF'),
    [System.Drawing.ColorTranslator]::FromHtml('#F1759F'),
    90
)
$bgPath = New-RoundedRectPath 10 10 236 236 52
$g.FillPath($bgBrush, $bgPath)

# --- Тень под книгой ---
$shadowBrush = New-Object System.Drawing.SolidBrush(
    [System.Drawing.Color]::FromArgb(45, 180, 60, 90)
)
$g.FillEllipse($shadowBrush, 54, 162, 148, 12)

# --- Страницы открытой книги ---
$pageTop = 88
$pageBottom = 156
$spineX = 128
$pageColorTop = [System.Drawing.ColorTranslator]::FromHtml('#FFF9F0')
$pageColorBottom = [System.Drawing.ColorTranslator]::FromHtml('#FCEBDB')
$pageRect = New-Object System.Drawing.RectangleF(56, 80, 144, 84)
$pageBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $pageRect, $pageColorTop, $pageColorBottom, 90
)
$outlinePen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#D47A9E'), 2.0)

function New-PagePath([bool]$left) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    if ($left) {
        $p.AddLines(@(
            (New-Object System.Drawing.PointF($spineX, $pageBottom)),
            (New-Object System.Drawing.PointF($spineX, $pageTop))
        ))
        $p.AddBezier(
            (New-Object System.Drawing.PointF($spineX, $pageTop)),
            (New-Object System.Drawing.PointF(112, 82)),
            (New-Object System.Drawing.PointF(86, 82)),
            (New-Object System.Drawing.PointF(66, 92))
        )
        $p.AddBezier(
            (New-Object System.Drawing.PointF(66, 92)),
            (New-Object System.Drawing.PointF(54, 98)),
            (New-Object System.Drawing.PointF(48, 122)),
            (New-Object System.Drawing.PointF(60, 150))
        )
        $p.AddBezier(
            (New-Object System.Drawing.PointF(60, 150)),
            (New-Object System.Drawing.PointF(66, 156)),
            (New-Object System.Drawing.PointF(110, 156)),
            (New-Object System.Drawing.PointF($spineX, $pageBottom))
        )
    } else {
        $p.AddLines(@(
            (New-Object System.Drawing.PointF($spineX, $pageTop)),
            (New-Object System.Drawing.PointF($spineX, $pageBottom))
        ))
        $p.AddBezier(
            (New-Object System.Drawing.PointF($spineX, $pageBottom)),
            (New-Object System.Drawing.PointF(146, 156)),
            (New-Object System.Drawing.PointF(190, 156)),
            (New-Object System.Drawing.PointF(196, 150))
        )
        $p.AddBezier(
            (New-Object System.Drawing.PointF(196, 150)),
            (New-Object System.Drawing.PointF(208, 122)),
            (New-Object System.Drawing.PointF(202, 98)),
            (New-Object System.Drawing.PointF(190, 92))
        )
        $p.AddBezier(
            (New-Object System.Drawing.PointF(190, 92)),
            (New-Object System.Drawing.PointF(170, 82)),
            (New-Object System.Drawing.PointF(144, 82)),
            (New-Object System.Drawing.PointF($spineX, $pageTop))
        )
    }
    $p.CloseFigure()
    return $p
}

$leftPath = New-PagePath $true
$rightPath = New-PagePath $false
$g.FillPath($pageBrush, $leftPath)
$g.FillPath($pageBrush, $rightPath)
$g.DrawPath($outlinePen, $leftPath)
$g.DrawPath($outlinePen, $rightPath)

# --- Корешок ---
$spinePen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#D16A92'), 3.0)
$g.DrawLine($spinePen, $spineX, $pageTop + 1, $spineX, $pageBottom - 1)

# --- «Строки текста» на страницах ---
$lineBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#E8A7C0'))
$lineCap = [System.Drawing.Drawing2D.LineCap]::Round
$linePen = New-Object System.Drawing.Pen($lineBrush, 4.0)
$linePen.StartCap = $lineCap
$linePen.EndCap = $lineCap

$leftLines = @(
    @(76, 110, 40),
    @(74, 124, 34),
    @(78, 138, 26)
)
$rightLines = @(
    @(140, 110, 40),
    @(148, 124, 34),
    @(152, 138, 26)
)
foreach ($ln in $leftLines) {
    $g.DrawLine($linePen, $ln[0], $ln[1], $ln[0] + $ln[2], $ln[1])
}
foreach ($ln in $rightLines) {
    $g.DrawLine($linePen, $ln[0], $ln[1], $ln[0] + $ln[2], $ln[1])
}

# --- Закладка-ленточка ---
$markPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$markPath.AddLines(@(
    (New-Object System.Drawing.PointF(123, 152)),
    (New-Object System.Drawing.PointF(133, 152)),
    (New-Object System.Drawing.PointF(133, 182)),
    (New-Object System.Drawing.PointF(128, 176)),
    (New-Object System.Drawing.PointF(123, 182))
))
$markPath.CloseFigure()
$markBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#C2396F'))
$g.FillPath($markBrush, $markPath)

# --- Блик на фоне (глянец) ---
$glossBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, 255, 255, 255))
$glossPath = New-RoundedRectPath 22 20 76 44 20
$g.FillPath($glossBrush, $glossPath)

# --- Искры (звёздочки) ---
$sparkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(190, 255, 255, 255))
$sparkPen = New-Object System.Drawing.Pen($sparkBrush, 4.0)
$sparkPen.StartCap = $lineCap
$sparkPen.EndCap = $lineCap
foreach ($sp in @(@(210, 62), @(52, 190))) {
    $g.DrawLine($sparkPen, $sp[0] - 7, $sp[1], $sp[0] + 7, $sp[1])
    $g.DrawLine($sparkPen, $sp[0], $sp[1] - 7, $sp[0], $sp[1] + 7)
}

# --- Сохранение PNG ---
$pngPath = Join-Path $outDir 'favicon.png'
$bitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

# --- Сборка ICO (256px с встроенным PNG) ---
$ms = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($ms)
$bw.Write([UInt16]0)
$bw.Write([UInt16]1)
$bw.Write([UInt16]1)
$bw.Write([byte]0)
$bw.Write([byte]0)
$bw.Write([byte]0)
$bw.Write([byte]0)
$bw.Write([UInt16]1)
$bw.Write([UInt16]32)
$pngBytes = [System.IO.File]::ReadAllBytes($pngPath)
$bw.Write([UInt32]$pngBytes.Length)
$bw.Write([UInt32]22)
$bw.Write($pngBytes)
$bw.Flush()
$icoPath = Join-Path $outDir 'icon.ico'
[System.IO.File]::WriteAllBytes($icoPath, $ms.ToArray())

$bw.Dispose()
$ms.Dispose()
$g.Dispose()
$bitmap.Dispose()

Write-Host "OK: $pngPath ($((Get-Item $pngPath).Length) b), $icoPath ($((Get-Item $icoPath).Length) b)"
