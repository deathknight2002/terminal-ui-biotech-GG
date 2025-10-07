Attribute VB_Name = "modHttp_GGets"
Option Explicit

' Robust HTTP helper with retries, backoff, and sensible defaults.
' Requires no additional references (late binding WinHTTP).
' Usage: HttpGet("https://...", 15000, 3)

Public Function HttpGet(ByVal url As String, Optional ByVal timeoutMs As Long = 15000, _
                        Optional ByVal retries As Integer = 3, _
                        Optional ByVal userAgent As String = "Mozilla/5.0 (Windows NT 10.0; Excel VBA)") As String
    Dim http As Object
    Dim attempt As Integer, delaySecs As Double

    delaySecs = 0.5
    For attempt = 1 To IIf(retries < 1, 1, retries)
        On Error Resume Next
        Set http = CreateObject("WinHttp.WinHttpRequest.5.1")
        If Not http Is Nothing Then
            http.Option(6) = True ' WinHttpRequestOption_EnableRedirects
            On Error GoTo 0
            ' SetTimeouts(resolve, connect, send, receive)
            On Error Resume Next
            http.SetTimeouts timeoutMs, timeoutMs, timeoutMs, timeoutMs
            On Error GoTo 0
            http.Open "GET", url, False
            On Error Resume Next
            http.SetRequestHeader "User-Agent", userAgent
            http.SetRequestHeader "Cache-Control", "no-cache"
            http.SetRequestHeader "Pragma", "no-cache"
            On Error GoTo 0
            http.Send

            If http.Status = 200 Then
                HttpGet = http.ResponseText
                Exit Function
            End If

            ' Handle throttling with exponential backoff
            If http.Status = 429 Or http.Status >= 500 Then
                Application.StatusBar = "HTTP " & http.Status & " — retrying (" & attempt & "/" & retries & ")"
                DoEvents
                Dim t As Single: t = Timer
                Do While Timer < t + delaySecs
                    DoEvents
                Loop
                delaySecs = delaySecs * 2
            Else
                Exit For
            End If
        Else
            ' Fallback to MSXML2 if WinHTTP fails to create
            Dim xhr As Object
            On Error Resume Next
            Set xhr = CreateObject("MSXML2.XMLHTTP")
            On Error GoTo 0
            If Not xhr Is Nothing Then
                xhr.Open "GET", url, False
                On Error Resume Next
                xhr.setRequestHeader "User-Agent", userAgent
                xhr.setRequestHeader "Cache-Control", "no-cache"
                xhr.setRequestHeader "Pragma", "no-cache"
                On Error GoTo 0
                xhr.send
                If xhr.readyState = 4 And xhr.Status = 200 Then
                    HttpGet = xhr.responseText
                    Exit Function
                End If
            End If
        End If
    Next attempt

    HttpGet = vbNullString
End Function