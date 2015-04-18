Imports System.Text
Imports Microsoft.VisualStudio.TestTools.UnitTesting

<TestClass()> Public Class ReportCodeUnitTests

    Dim testInstance As TestContext
    Public Property TestContext As TestContext
        Get
            Return testInstance
        End Get
        Set(value As TestContext)
            testInstance = value
        End Set
    End Property

    <TestMethod()> Public Sub WeekDateTest()
        Dim test1 = New Date(2015, 4, 8)            ' Wednesday
        Dim test2 = New Date(2015, 4, 8, 7, 16, 0)  ' Wednesday with a time
        Dim test3 = New Date(2015, 4, 5)            ' Sunday
        Dim test4 = New Date(2015, 4, 11)           ' Saturday

        Dim expectedStart = New Date(2015, 4, 5)
        Dim notExpectedStart = New Date(2015, 4, 4)

        Assert.IsFalse(notExpectedStart = GetWeekStartDate(test1))
        Assert.IsTrue(expectedStart = GetWeekStartDate(test1))
        Assert.IsTrue(expectedStart = GetWeekStartDate(test2))
        Assert.IsTrue(expectedStart = GetWeekStartDate(test3))
        Assert.IsTrue(expectedStart = GetWeekStartDate(test4))

        Dim expectedEnd = New Date(2015, 4, 11, 23, 59, 59)

        Assert.IsTrue(expectedEnd = GetWeekEndDate(test1))
        Assert.IsTrue(expectedEnd = GetWeekEndDate(test2))
        Assert.IsTrue(expectedEnd = GetWeekEndDate(test3))
        Assert.IsTrue(expectedEnd = GetWeekEndDate(test4))

        Dim range = GetWeekRange(test1)
        Assert.IsNotNull(range)

        TestContext.WriteLine("range: {0}", range)

    End Sub

    Public Function GetWeekStartDate(d As Date) As Date

        Dim s = DateAdd(DateInterval.Day, -DatePart(DateInterval.Weekday, d) + 1, d)
        Return DateSerial(Year(s), Month(s), Day(s))

    End Function

    Public Function GetWeekEndDate(d As Date) As Date

        Dim s = DateAdd(DateInterval.Day, 7 - DatePart(DateInterval.Weekday, d), d)
        Return New Date(Year(s), Month(s), Day(s), 23, 59, 59)

    End Function

    Public Function GetWeekRange(d As Date) As String

        Dim s = GetWeekStartDate(d)
        Dim e = GetWeekEndDate(d)
        Dim f = "MMM, d yyyy"
        Return Format(s, f) + " - " + Format(e, f)

    End Function

End Class