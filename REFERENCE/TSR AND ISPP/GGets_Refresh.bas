Attribute VB_Name = "GGets_Refresh"
Option Explicit

' ==============================================
'   Fact-ish Yahoo Refresher — Biopharma flavor
'   Drop-in upgrade for "RefreshYahoo_v2.bas"
'   Adds: robust HTTP, FX handling, quote metrics,
'         ISPP index, logging, and "glass" UI.
' ==============================================

' --- User knobs ---
Private Const BASE_CCY As String = "USD"

' Named ranges / control cells (kept compatible with your workbook):
' B3: Start Date
' B4: Pricing Date (End)
' B5: Return Type  ("PRICE" | "TSR" | "ISPP")
' B6: Base Currency (currently only "USD")
' B7: Index Base (e.g., 100)
' B8: Index Style ("LEVEL" | "% RETURN")
'
' Tickers table starting row 12 with columns:
'   A: Include (TRUE/FALSE), B: Ticker, C: Display Name, D: Listing CCY, E: FX Override Pair

' --- Public entrypoint wired to the button ---
Public Sub GGets_Refresh()
    On Error GoTo HardFail

    modUI_GGets_Aurora.EnsureGGetsUI
    modUI_GGets_Aurora.ShowGGLoading "GGets Aurora — refreshing market data…"

    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    Application.EnableEvents = False

    Dim wsC As Worksheet, wsD As Worksheet, wsM As Worksheet, wsL As Worksheet
    Set wsC = ThisWorkbook.Worksheets("Control")
    Set wsD = EnsureSheet("Data")
    Set wsM = EnsureSheet("BioMetrics")
    Set wsL = EnsureSheet("Log")

    ' Read controls
    Dim startDate As Date, endDate As Date, retType As String, baseCcy As String, indexStyle As String
    Dim indexBase As Double

    startDate = wsC.Range("B3").Value
    endDate = wsC.Range("B4").Value
    retType = UCase$(Trim$(wsC.Range("B5").Value))
    baseCcy = UCase$(Trim$(wsC.Range("B6").Value))
    indexBase = CDbl(Val(wsC.Range("B7").Value))
    indexStyle = UCase$(Trim$(wsC.Range("B8").Value))

    If baseCcy <> BASE_CCY Then
        MsgBox "Only " & BASE_CCY & " is supported as base currency in this version.", vbExclamation
        GoTo CleanExit
    End If
    If endDate < startDate Then
        MsgBox "Pricing Date must be >= Start Date.", vbExclamation
        GoTo CleanExit
    End If

    ' Read tickers
    Dim lastRow As Long: lastRow = wsC.Cells(wsC.Rows.Count, "B").End(xlUp).Row
    Dim tickers() As String, names() As String, listCcy() As String, fxOverride() As String
    Dim n As Long, r As Long
    For r = 12 To lastRow
        Dim incV, tkr, nm, ccy, fxov
        incV = wsC.Cells(r, 1).Value
        tkr = Trim$(wsC.Cells(r, 2).Value & "")
        nm = Trim$(wsC.Cells(r, 3).Value & "")
        ccy = UCase$(Trim$(wsC.Cells(r, 4).Value & ""))
        fxov = Trim$(wsC.Cells(r, 5).Value & "")
        If Len(tkr) > 0 And (CStr(incV) = "TRUE" Or incV = True) Then
            n = n + 1
            ReDim Preserve tickers(1 To n), names(1 To n), listCcy(1 To n), fxOverride(1 To n)
            tickers(n) = tkr
            names(n) = IIf(Len(nm) > 0, nm, tkr)
            listCcy(n) = IIf(Len(ccy) > 0, ccy, BASE_CCY)
            fxOverride(n) = fxov
        End If
    Next r
    If n = 0 Then
        MsgBox "No included tickers found on Control sheet.", vbExclamation
        GoTo CleanExit
    End If

    ' Build weekday date vector
    Dim datesArr() As Date: datesArr = BuildDateVector(startDate, endDate)

    ' Clear Data & write headers
    wsD.Cells.Clear
    wsD.Range("A1").Value = "Date"
    wsD.Range("A2").Resize(UBound(datesArr) - LBound(datesArr) + 1, 1).Value = Application.WorksheetFunction.Transpose(datesArr)
    wsD.Columns(1).NumberFormat = "yyyy-mm-dd"
    wsD.Range("A1").Font.Bold = True

    ' Prep BioMetrics sheet
    wsM.Cells.Clear
    wsM.Range("A1:H1").Value = Array("Ticker", "Name", "List CCY", "Price", "Market Cap (USD)", "Shares Out", "Enterprise Value", "52W Range")
    wsM.Range("A1:H1").Font.Bold = True

    Dim col As Long: col = 2
    Dim i As Long

    For i = 1 To n
        Application.StatusBar = "Fetching " & tickers(i) & " (" & i & "/" & n & ")"

        Dim metric As String: metric = IIf(retType = "TSR", "Adj Close", "Close")
        Dim histUrl As String: histUrl = YahooCSVUrl(tickers(i), startDate, endDate, "history")
        Dim csv As String: csv = modHttp.HttpGet(histUrl, 15000, 3)

        If Not IsValidCSV(csv) Then
            LogMsg wsL, tickers(i), "history", "Invalid CSV or blocked"
            wsD.Cells(1, col).Value = names(i) & " (ERROR)"
            col = col + 1
            GoTo NextTicker
        End If

        Dim px As Object: Set px = ParseYahooHistory(csv, metric)

        ' FX normalize to USD if needed
        Dim fx As Object
        If listCcy(i) <> BASE_CCY Then
            Set fx = GetFXSeries(listCcy(i), BASE_CCY, startDate, endDate, fxOverride(i))
            If fx Is Nothing Then
                LogMsg wsL, tickers(i), "fx", "Missing FX pair"
            Else
                Set px = MultiplySeries(px, fx)
            End If
        End If

        Dim outArr() As Variant: outArr = AlignAndFfill(px, datesArr)

        ' ISPP or raw
        Dim headerText As String, numberFmt As String
        If retType = "ISPP" Then
            Dim baseVal As Double: baseVal = FirstNonEmpty(outArr)
            If baseVal > 0 Then
                Dim idxArr() As Variant: ReDim idxArr(LBound(outArr) To UBound(outArr))
                Dim k As Long
                If indexStyle = "LEVEL" Then
                    For k = LBound(outArr) To UBound(outArr)
                        If IsEmpty(outArr(k)) Or outArr(k) = "" Then
                            idxArr(k) = Empty
                        Else
                            idxArr(k) = indexBase * (CDbl(outArr(k)) / baseVal)
                        End If
                    Next k
                    numberFmt = "#,##0.00"
                    headerText = names(i) & " (ISPP Base=" & CStr(indexBase) & ")"
                Else
                    For k = LBound(outArr) To UBound(outArr)
                        If IsEmpty(outArr(k)) Or outArr(k) = "" Then
                            idxArr(k) = Empty
                        Else
                            idxArr(k) = (CDbl(outArr(k)) / baseVal) - 1#
                        End If
                    Next k
                    numberFmt = "0.0%"
                    headerText = names(i) & " (% Return from Base)"
                End If
                wsD.Cells(1, col).Value = headerText
                wsD.Range(Cells(2, col), Cells(UBound(idxArr) + 1, col)).Value = Application.WorksheetFunction.Transpose(idxArr)
            Else
                wsD.Cells(1, col).Value = names(i) & " (INDEX ERROR)"
            End If
        Else
            numberFmt = "#,##0.00"
            wsD.Cells(1, col).Value = names(i) & " (" & BASE_CCY & ")"
            wsD.Range(Cells(2, col), Cells(UBound(outArr) + 1, col)).Value = Application.WorksheetFunction.Transpose(outArr)
        End If

        wsD.Columns(col).NumberFormat = numberFmt
        col = col + 1

        ' --- Quote metrics for BioMetrics sheet (best-effort) ---
        Dim q As Variant
        q = FetchQuoteQuick(tickers(i))
        Dim rowM As Long: rowM = i + 1
        wsM.Cells(rowM, 1).Value = tickers(i)
        wsM.Cells(rowM, 2).Value = names(i)
        wsM.Cells(rowM, 3).Value = listCcy(i)
        wsM.Cells(rowM, 4).Value = GetDict(q, "price")
        wsM.Cells(rowM, 5).Value = GetDict(q, "marketCap")
        wsM.Cells(rowM, 6).Value = GetDict(q, "sharesOutstanding")
        wsM.Cells(rowM, 7).Value = GetDict(q, "enterpriseValue")
        wsM.Cells(rowM, 8).Value = GetDict(q, "range52w")

NextTicker:
        DoEvents
    Next i

    ' Polish
    wsD.Columns("A:" & ColLetter(col - 1)).AutoFit
    wsD.Range("A1:" & ColLetter(col - 1) & "1").Font.Bold = True
    wsD.Activate
    wsD.Range("A2").Select

    wsM.Columns("A:H").AutoFit

CleanExit:
    Application.StatusBar = False
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    modUI_GGets_Aurora.HideGGLoading
    Exit Sub
HardFail:
    Application.StatusBar = False
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    modUI_GGets_Aurora.HideGGLoading
    MsgBox "Refresh failed: " & Err.Number & " — " & Err.Description, vbCritical
End Sub

' === Helpers below (CSV, FX, Dates) — compatible with your v2 ===

Private Function YahooCSVUrl(ByVal ticker As String, ByVal startDate As Date, ByVal endDate As Date, ByVal events As String) As String
    Dim p1 As Long, p2 As Long
    p1 = UnixTime(startDate)
    p2 = UnixTime(endDate + 1) ' Yahoo period2 is exclusive
    YahooCSVUrl = "https://query1.finance.yahoo.com/v7/finance/download/" & URLEncode(ticker) & _
                  "?period1=" & CStr(p1) & "&period2=" & CStr(p2) & _
                  "&interval=1d&events=" & events & "&includeAdjustedClose=true"
End Function

Private Function FetchQuoteQuick(ByVal ticker As String) As Object
    ' Best-effort: try quoteSummary first (for EV), then fallback to quote
    Dim dict As Object: Set dict = CreateObject("Scripting.Dictionary")

    Dim url1 As String
    url1 = "https://query1.finance.yahoo.com/v10/finance/quoteSummary/" & URLEncode(ticker) & _
           "?modules=price,defaultKeyStatistics,financialData,summaryDetail"
    Dim js As String: js = modHttp.HttpGet(url1, 12000, 2)
    If Len(js) > 0 Then
        ParseQuoteSummary js, dict
    End If

    If dict.Count = 0 Or Not dict.Exists("price") Then
        Dim url2 As String
        url2 = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=" & URLEncode(ticker)
        Dim js2 As String: js2 = modHttp.HttpGet(url2, 12000, 2)
        If Len(js2) > 0 Then
            ParseQuoteSlim js2, dict
        End If
    End If

    Set FetchQuoteQuick = dict
End Function

' NOTE: For reliable JSON parsing, import VBA-JSON (JsonConverter.bas) and set JsonConverter.JsonConverterEarlyBinding = False.
' The parsers below attempt minimal extraction without external libs (works for common fields).

Private Sub ParseQuoteSlim(ByVal js As String, ByRef out As Object)
    ' Extract a few fields with simple searches (not a full JSON parser).
    On Error Resume Next
    out("price") = CDbl(ExtractNumber(js, """regularMarketPrice"":"))
    out("marketCap") = CDbl(ExtractNumber(js, """marketCap"":"))
    out("sharesOutstanding") = CDbl(ExtractNumber(js, """sharesOutstanding"":"))
    Dim lo As Double, hi As Double
    lo = CDbl(ExtractNumber(js, """fiftyTwoWeekLow"":"))
    hi = CDbl(ExtractNumber(js, """fiftyTwoWeekHigh"":"))
    If lo > 0 And hi > 0 Then out("range52w") = lo & " – " & hi
End Sub

Private Sub ParseQuoteSummary(ByVal js As String, ByRef out As Object)
    ' Minimalist parse for enterpriseValue + others
    On Error Resume Next
    Dim ev As Double: ev = CDbl(ExtractNumber(js, """enterpriseValue"":{""raw"":"))
    If ev > 0 Then out("enterpriseValue") = ev
    Dim px As Double: px = CDbl(ExtractNumber(js, """regularMarketPrice"":{""raw"":"))
    If px > 0 Then out("price") = px
    Dim mc As Double: mc = CDbl(ExtractNumber(js, """marketCap"":{""raw"":"))
    If mc > 0 Then out("marketCap") = mc
    Dim so As Double: so = CDbl(ExtractNumber(js, """sharesOutstanding"":{""raw"":"))
    If so > 0 Then out("sharesOutstanding") = so
    Dim lo As Double: lo = CDbl(ExtractNumber(js, """fiftyTwoWeekLow"":{""raw"":"))
    Dim hi As Double: hi = CDbl(ExtractNumber(js, """fiftyTwoWeekHigh"":{""raw"":"))
    If lo > 0 And hi > 0 Then out("range52w") = lo & " – " & hi
End Sub

Private Function ExtractNumber(ByVal js As String, ByVal key As String) As String
    Dim p As Long, q As Long, s As String
    p = InStr(1, js, key, vbTextCompare)
    If p = 0 Then Exit Function
    p = p + Len(key)
    ' Skip whitespace and colon(s)
    Do While p <= Len(js) And Mid$(js, p, 1) Like " " Or Mid$(js, p, 1) = ":"
        p = p + 1
    Loop
    ' Read number (could be decimal or integer)
    q = p
    Do While q <= Len(js)
        Dim ch As String: ch = Mid$(js, q, 1)
        If (ch >= "0" And ch <= "9") Or ch = "." Or ch = "-" Or ch = "E" Or ch = "e" Then
            q = q + 1
        Else
            Exit Do
        End If
    Loop
    s = Mid$(js, p, q - p)
    ExtractNumber = s
End Function

Private Sub LogMsg(ByVal ws As Worksheet, ByVal ticker As String, ByVal phase As String, ByVal msg As String)
    Dim r As Long: r = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row + 1
    ws.Cells(r, 1).Value = Now
    ws.Cells(r, 2).Value = ticker
    ws.Cells(r, 3).Value = phase
    ws.Cells(r, 4).Value = msg
    If r = 1 Then ws.Range("A1:D1").Value = Array("Timestamp", "Ticker", "Step", "Message")
End Sub

' === Compatibility helpers (copied from your v2 where relevant) ===

Private Function BuildDateVector(ByVal startDate As Date, ByVal endDate As Date) As Date()
    Dim d As Date, tmp() As Date, n As Long
    For d = startDate To endDate
        If Weekday(d, vbMonday) <= 5 Then
            n = n + 1
            ReDim Preserve tmp(1 To n)
            tmp(n) = d
        End If
    Next d
    BuildDateVector = tmp
End Function

Private Function ParseYahooHistory(ByVal csv As String, ByVal colName As String) As Object
    Dim dict As Object: Set dict = CreateObject("Scripting.Dictionary")
    Dim lines() As String: lines = Split(csv, vbLf)
    Dim header As String, cols() As String
    Dim i As Long, iCol As Long, iDate As Long

    If UBound(lines) < 1 Then Set ParseYahooHistory = dict: Exit Function
    header = Trim$(lines(0)): cols = Split(header, ",")
    iCol = -1: iDate = -1
    For i = LBound(cols) To UBound(cols)
        If Trim$(cols(i)) = colName Then iCol = i
        If Trim$(cols(i)) = "Date" Then iDate = i
    Next i
    If iCol < 0 Or iDate < 0 Then Set ParseYahooHistory = dict: Exit Function

    Dim r As Long
    For r = 1 To UBound(lines)
        Dim ln As String: ln = Trim$(lines(r))
        If Len(ln) = 0 Then GoTo NextR
        Dim parts() As String: parts = Split(ln, ",")
        If UBound(parts) < iCol Then GoTo NextR
        Dim dt As String: dt = parts(iDate)
        Dim v As String: v = parts(iCol)
        If LCase$(v) = "null" Or LCase$(v) = "nan" Or Len(v) = 0 Then GoTo NextR
        On Error Resume Next: dict(dt) = CDbl(v): On Error GoTo 0
NextR:
    Next r
    Set ParseYahooHistory = dict
End Function

Private Function MultiplySeries(ByVal px As Object, ByVal fx As Object) As Object
    Dim out As Object: Set out = CreateObject("Scripting.Dictionary")
    Dim k As Variant
    For Each k In px.Keys
        If fx.Exists(k) Then
            out(k) = px(k) * fx(k)
        Else
            out(k) = px(k)
        End If
    Next k
    Set MultiplySeries = out
End Function

Private Function InvertSeries(ByVal dict As Object) As Object
    Dim out As Object: Set out = CreateObject("Scripting.Dictionary")
    Dim k As Variant
    For Each k In dict.Keys
        If dict(k) <> 0 Then out(k) = 1# / dict(k)
    Next k
    Set InvertSeries = out
End Function

Private Function NormalizeFX(ByVal dict As Object, ByVal pair As String, ByVal fromCcy As String, ByVal toCcy As String) As Object
    pair = UCase$(pair)
    Dim expected As String: expected = UCase$(fromCcy & toCcy & "=X")
    If pair = expected Then Set NormalizeFX = dict Else Set NormalizeFX = InvertSeries(dict)
End Function

Private Function GetFXSeries(ByVal fromCcy As String, ByVal toCcy As String, ByVal startDate As Date, ByVal endDate As Date, ByVal overridePair As String) As Object
    Dim pair As String, csv As String
    If Len(overridePair) > 0 Then
        pair = overridePair
        csv = modHttp.HttpGet(YahooCSVUrl(pair, startDate, endDate, "history"), 15000, 2)
        If IsValidCSV(csv) Then
            Set GetFXSeries = NormalizeFX(ParseYahooHistory(csv, "Close"), pair, fromCcy, toCcy)
            Exit Function
        End If
    End If
    pair = UCase$(fromCcy & toCcy & "=X")
    csv = modHttp.HttpGet(YahooCSVUrl(pair, startDate, endDate, "history"), 15000, 2)
    If Not IsValidCSV(csv) Then
        pair = UCase$(toCcy & fromCcy & "=X")
        csv = modHttp.HttpGet(YahooCSVUrl(pair, startDate, endDate, "history"), 15000, 2)
        If Not IsValidCSV(csv) Then
            Set GetFXSeries = Nothing: Exit Function
        Else
            Dim dictInv As Object: Set dictInv = ParseYahooHistory(csv, "Close")
            Set GetFXSeries = InvertSeries(dictInv): Exit Function
        End If
    Else
        Set GetFXSeries = ParseYahooHistory(csv, "Close"): Exit Function
    End If
End Function

Private Function AlignAndFfill(ByVal dict As Object, ByVal datesArr() As Date) As Variant()
    Dim out() As Variant, i As Long, lastV As Double, hasLast As Boolean
    ReDim out(1 To UBound(datesArr) - LBound(datesArr) + 1)
    For i = LBound(datesArr) To UBound(datesArr)
        Dim dtKey As String: dtKey = Format$(datesArr(i), "yyyy-mm-dd")
        If dict.Exists(dtKey) Then
            out(i - LBound(datesArr) + 1) = dict(dtKey)
            lastV = dict(dtKey): hasLast = True
        Else
            If hasLast Then out(i - LBound(datesArr) + 1) = lastV Else out(i - LBound(datesArr) + 1) = Empty
        End If
    Next i
    AlignAndFfill = out
End Function

Private Function FirstNonEmpty(ByRef arr() As Variant) As Double
    Dim i As Long
    For i = LBound(arr) To UBound(arr)
        If Not IsEmpty(arr(i)) And arr(i) <> "" Then FirstNonEmpty = CDbl(arr(i)): Exit Function
    Next i
    FirstNonEmpty = 0#
End Function

Private Function IsValidCSV(ByVal csv As String) As Boolean
    IsValidCSV = (Len(csv) > 50 And InStr(1, csv, "Date,Open,High,Low,Close,Adj Close,Volume", vbTextCompare) > 0)
End Function

Private Function UnixTime(ByVal d As Date) As Long
    UnixTime = DateDiff("s", "01/01/1970 00:00:00", d)
End Function

Private Function URLEncode(ByVal sText As String) As String
    Dim i As Long, sChar As String, sOut As String
    For i = 1 To Len(sText)
        sChar = Mid$(sText, i, 1)
        Select Case AscW(sChar)
            Case 48 To 57, 65 To 90, 97 To 122, 45, 46, 95, 126: sOut = sOut & sChar
            Case Else: sOut = sOut & "%" & Right$("0" & Hex(AscW(sChar)), 2)
        End Select
    Next i
    URLEncode = sOut
End Function

Private Function EnsureSheet(ByVal name As String) As Worksheet
    On Error Resume Next: Set EnsureSheet = ThisWorkbook.Worksheets(name): On Error GoTo 0
    If EnsureSheet Is Nothing Then
        Set EnsureSheet = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets(ThisWorkbook.Worksheets.Count))
        EnsureSheet.Name = name
    End If
End Function

Private Function ColLetter(ByVal col As Long) As String
    Dim vArr
    vArr = Split(Cells(1, col).Address(True, False), "$")
    ColLetter = vArr(0)
End Function

Private Function GetDict(ByVal d As Object, ByVal k As String) As Variant
    On Error Resume Next
    GetDict = d(k)
End Function

Public Sub Refresh_Yahoo_Pro()
    GGets_Refresh
End Sub
