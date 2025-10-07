Attribute VB_Name = "modUI_GGets_Aurora"
Option Explicit

' Creates a simple "glass" UI with a refresh bubble button and a loading overlay.
' The overlay is lightweight: semi-transparent panel + rotating spinner arc.

Private Const BTN_NAME As String = "ui_btn_refresh"
Private Const OVERLAY_NAME As String = "ui_loading_overlay"
Private Const SPINNER_NAME As String = "ui_spinner"
Private m_spinAngle As Single
Private m_spinOn As Boolean

Public Sub EnsureGGetsUI()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets("Control")

    Dim btn As Shape
    On Error Resume Next
    Set btn = ws.Shapes(BTN_NAME)
    On Error GoTo 0

    If btn Is Nothing Then
        Set btn = ws.Shapes.AddShape(msoShapeRoundedRectangle, 550, 40, 150, 42)
        With btn
            .Name = BTN_NAME
            .TextFrame2.TextRange.Text = "GGets Refresh"
            .OnAction = "Refresh_Yahoo_Pro"
            .RoundedCorners = msoTrue
            .Fill.ForeColor.RGB = RGB(255, 255, 255)
            .Fill.Transparency = 0.35
            .Fill.TwoColorGradient msoGradientHorizontal, 1
            .Line.ForeColor.RGB = RGB(200, 200, 200)
            .Line.Transparency = 0.4
            .Glow.Color.RGB = RGB(180, 210, 255)
            .Glow.Radius = 6
            .Reflection.Type = msoReflectionType5
            .TextFrame2.TextRange.ParagraphFormat.Alignment = msoAlignCenter
            .TextFrame2.VerticalAnchor = msoAnchorMiddle
            .TextFrame2.TextRange.Font.Size = 12
            .TextFrame2.TextRange.Font.Bold = msoTrue
        End With
    End If
End Sub

Public Sub ShowGGLoading(Optional ByVal message As String = "Refreshing…")
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets("Control")

    Dim overlay As Shape
    On Error Resume Next
    Set overlay = ws.Shapes(OVERLAY_NAME)
    On Error GoTo 0

    If overlay Is Nothing Then
        Set overlay = ws.Shapes.AddShape(msoShapeRectangle, 0, 0, ws.UsedRange.Width + 100, ws.UsedRange.Height + 100)
        overlay.Name = OVERLAY_NAME
        overlay.Fill.ForeColor.RGB = RGB(6, 7, 25)
        overlay.Fill.Transparency = 0.25
        overlay.Line.Visible = msoFalse
        overlay.LockAspectRatio = msoFalse
        overlay.ZOrder msoBringToFront

        ' Add spinner
        Dim sp As Shape
        Set sp = ws.Shapes.AddShape(msoShapeDonut, 320, 40, 35, 35)
        sp.Name = SPINNER_NAME
        sp.Fill.ForeColor.RGB = RGB(139, 92, 246)
        sp.Fill.Transparency = 0.15
        sp.Line.Visible = msoFalse
        sp.ZOrder msoBringToFront
    End If

    ' Add label text
    On Error Resume Next
    Dim lbl As Shape: Set lbl = ws.Shapes("ui_loading_label")
    On Error GoTo 0
    If lbl Is Nothing Then
        Set lbl = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, 360, 43, 220, 18)
        lbl.Name = "ui_loading_label"
        lbl.TextFrame2.TextRange.Text = message
        lbl.TextFrame2.TextRange.Font.Size = 12
        lbl.TextFrame2.TextRange.Font.Bold = msoTrue
        lbl.Line.Visible = msoFalse
        lbl.Fill.Visible = msoFalse
        lbl.ZOrder msoBringToFront
    Else
        lbl.TextFrame2.TextRange.Text = message
    End If

    overlay.Visible = msoTrue
    ws.Shapes(SPINNER_NAME).Visible = msoTrue
    ws.Shapes("ui_loading_label").Visible = msoTrue

    m_spinAngle = 0
    m_spinOn = True
    SpinTick
End Sub

Public Sub SpinTick()
    If Not m_spinOn Then Exit Sub
    Dim ws As Worksheet: Set ws = ThisWorkbook.Worksheets("Control")
    On Error Resume Next
    Dim sp As Shape: Set sp = ws.Shapes(SPINNER_NAME)
    On Error GoTo 0
    If sp Is Nothing Then Exit Sub

    m_spinAngle = (m_spinAngle + 15) Mod 360
    sp.Rotation = m_spinAngle
    DoEvents
    Application.OnTime Now + TimeSerial(0, 0, 0) + TimeValue("00:00:00.08"), "modUI_Glass.SpinTick", , True
End Sub

Public Sub HideGGLoading()
    m_spinOn = False
    Dim ws As Worksheet: Set ws = ThisWorkbook.Worksheets("Control")
    On Error Resume Next
    ws.Shapes(OVERLAY_NAME).Visible = msoFalse
    ws.Shapes(SPINNER_NAME).Visible = msoFalse
    ws.Shapes("ui_loading_label").Visible = msoFalse
    Application.StatusBar = False
    On Error GoTo 0
End Sub