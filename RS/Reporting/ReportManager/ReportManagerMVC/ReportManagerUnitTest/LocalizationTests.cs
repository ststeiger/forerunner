using System;
using System.IO;
using System.Collections;
using System.Collections.Generic;
using System.Web.Helpers;
using System.Dynamic;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace ReportManagerUnitTest
{
    public enum ProcessResult
    {
        UpToDate = 0,
        Changed = 1,
        NeedsTranslation = 2,
        IncompatibleTypes = 3,
    }

    public class Section : Dictionary<String, Object>
    {
        public ProcessResult Process(Section section, String sectionName, String cultureName, LocFile exceptionLocFile, bool skipTranslationCheck, bool skipAddPropertyProcessing, TestContext TestContext)
        {
            ProcessResult result = ProcessResult.UpToDate;

            foreach (KeyValuePair<String, Object> pair in this)
            {
                if (!section.ContainsKey(pair.Key))
                {
                    TestContext.WriteLine("  Missing value - section: {0}, property: {1}", sectionName, pair.Key);
                    if (!skipAddPropertyProcessing)
                    {
                        section.Add(pair.Key, pair.Value);
                        result |= ProcessResult.Changed;
                    }
                }

                if (!skipTranslationCheck &&
                    !exceptionLocFile.IsException(sectionName, pair.Key, cultureName))
                {
                    String thisValue = "";
                    if (this[pair.Key].GetType() == typeof(String))
                    {
                        thisValue = (String)this[pair.Key];
                    }
                    if (section[pair.Key].GetType() != this[pair.Key].GetType())
                    {
                        TestContext.WriteLine("  Value type mismatch - section name: {0}, section type: {1}, master type: {2}", sectionName, section[pair.Key].GetType(), this[pair.Key].GetType());
                        result |= ProcessResult.IncompatibleTypes;
                    }
                    else if (section[pair.Key].GetType() == typeof(String) &&
                        String.Compare((String)section[pair.Key], (String)this[pair.Key], true) == 0 &&
                        thisValue.Length > 0)
                    {
                        TestContext.WriteLine("  Value needs translation - section: {0}, property: {1}, value: \"{2}\"", sectionName, pair.Key, section[pair.Key]);
                        result |= ProcessResult.NeedsTranslation;
                    }
                    else if (section[pair.Key].GetType() == typeof(ArrayList))
                    {
                        ArrayList master = (ArrayList)this[pair.Key];
                        ArrayList loc = (ArrayList)section[pair.Key];
                        Assert.IsTrue(master.Count == loc.Count, String.Format("Count mismatch in array property: {0}, section: {1}, cutureName: {2}", pair.Key, sectionName, cultureName));
                        for (int i = 0; i < master.Count; i++)
                        {
                            if (String.Compare((String)master[i], (String)loc[i], true) == 0)
                            {
                                TestContext.WriteLine("  Value needs translation - section: {0}, property: {1}, Index: {2}, value: \"{3}\"", sectionName, pair.Key, i, loc[i]);
                                result |= ProcessResult.NeedsTranslation;
                            }
                        }
                    }
                }
            }

            return result;
        }
    }

    public class LocFile : Dictionary<String, Section>
    {
        public LocFile()
        {
        }

        public void Load(String fullname)
        {
            String json;
            using (StreamReader sr = new StreamReader(fullname, Encoding.UTF8))
            {
                json = sr.ReadToEnd();
            }

            dynamic sections = null;
            try
            {
                sections = Json.Decode(json);
            }
            catch (System.ArgumentException e)
            {
                Assert.Fail("Invalid syntax - filename: {0}\ne.message: {1}", Path.GetFileName(fullname), e.Message);
            }

            foreach (var sectionPair in sections)
            {
                String key = sectionPair.Key;
                dynamic sectionObject = sectionPair.Value;

                Section newSection = new Section();
                foreach (dynamic valuePair in sectionObject)
                {
                    if (valuePair.Value.GetType() == typeof(System.Web.Helpers.DynamicJsonArray))
                    {
                        ArrayList a = new ArrayList();
                        foreach (String itemValue in valuePair.Value)
                        {
                            a.Add(itemValue);
                        }
                        newSection.Add(valuePair.Key, a);
                    }
                    else
                    {
                        newSection.Add(valuePair.Key, valuePair.Value);
                    }
                }
                Add(key, newSection);
            }
        }

        public ProcessResult Process(LocFile locFile, String cultureName, LocFile exceptionLocFile, bool skipTranslationCheck, bool skipAddPropertyProcessing, TestContext TestContext)
        {
            ProcessResult result = ProcessResult.UpToDate;

            foreach (KeyValuePair<String, Section> pair in this)
            {
                if (!locFile.ContainsKey(pair.Key))
                {
                    TestContext.WriteLine("  Missing section: {0}", pair.Key);
                    if (!skipAddPropertyProcessing)
                    {
                        result |= ProcessResult.Changed;
                        locFile.Add(pair.Key, pair.Value);
                        ProcessResult processResult = pair.Value.Process(locFile[pair.Key], pair.Key, cultureName, exceptionLocFile, skipTranslationCheck, skipAddPropertyProcessing, TestContext);
                        result |= processResult;

                    }
                }
                else
                {
                    ProcessResult processResult = pair.Value.Process(locFile[pair.Key], pair.Key, cultureName, exceptionLocFile, skipTranslationCheck, skipAddPropertyProcessing, TestContext);
                    result |= processResult;
                }
            }

            return result;
        }

        public bool IsException(String sectionName, String propertyName, String cultureName)
        {
            if (this.ContainsKey(sectionName) &&
                this[sectionName].ContainsKey(propertyName))
            {
                if (this[sectionName][propertyName].GetType() != typeof(ArrayList))
                {
                    return true;
                }

                ArrayList a = (ArrayList)this[sectionName][propertyName];
                if (a.Count == 0)
                {
                    return true;
                }

                foreach (String exceptionCulture in a)
                {
                    if (String.Compare(exceptionCulture, cultureName, true) == 0)
                    {
                        return true;
                    }
                }
            }
            return false;
        }
    }

    [TestClass]
    public class LocalizationTests
    {
        public TestContext TestContext { get; set; }

        private bool IsEnglish(String filename)
        {
            String cultureName = GetCultureName(filename);
            return String.Compare(cultureName.Substring(0, 2), "en", true) == 0;
        }

        private String GetCultureName(String filename)
        {
            String pattern = @"(-\w\w-\w\w)|(-\w\w)";
            Regex regex = new Regex(pattern);

            Match match = regex.Match(filename);
            if (match.Index >= 0)
            {
                return match.Value.Substring(1);
            }

            return "";
        }

        [TestCategory("Manual")]
        [TestMethod]
        public void LocTestWithWriteback()
        {
            LocTest(false);
        }

        [TestCategory("Build")]
        [TestMethod]
        public void MissingTranslationTest()
        {
            LocTest(true);
        }

        private static string FormatForEditing(string jsonString)
        {
            if (jsonString.StartsWith("{"))
            {
                jsonString = "{\n  " + jsonString.Substring(1);
            }
            // Allow any arrays to stay on the same line
            jsonString = Regex.Replace(jsonString, @""":\[(?<list>(""[^""]*"",)*)(?<last>""[^""]*"")\]", MatchEvaluator);
            // Get rid of any extraneous escape sequesnces
            jsonString = jsonString.Replace("\\u0027", "'");
            // Put members on new lines
            jsonString = jsonString.Replace("\",\"", "\",\n    \"");
            // Put members following an array on a new line
            jsonString = jsonString.Replace("\"],\"", "\"],\n    \"");
            // Put new objects on a new line
            jsonString = jsonString.Replace("\":{\"", "\": {\n    \"");
            jsonString = jsonString.Replace("\"},\"", "\"\n  },\n  \"");
            jsonString = jsonString.Replace("\"]},\"", "\"]},\n  \"");
            // Put the final object closing paran on a new line
            jsonString = jsonString.Replace("}}", "\n  }\n}\n");
            // Put boolean members on a new line
            jsonString = jsonString.Replace("\":false,\"", "\":false,\n    \"");
            jsonString = jsonString.Replace("\":true,\"", "\":true,\n    \"");
            // Put integer types on a new line
            jsonString = Regex.Replace(jsonString, @""":(\d+),""", "\":$1,\n    \"");

            return jsonString;
        }

        private static String MatchEvaluator(Match match)
        {
            string returnValue = match.Value.Replace(@""",""", @""", """);
            return returnValue;
        }

        [TestCategory("Manual")]
        [TestMethod]
        public void FormatTest()
        {
            String jsonString = "{\"messages\":{\"loading\":\"Laden...\",\"completeFind\":\"Der gesamte Bericht wurde durchsucht\",\"keyNotFound\":\"Key nicht gefunden\",\"sessionExpired\":\"Ihre Sitzung ist abgelaufen\",\"imageNotDisplay\":\"Bild kann nicht angezeigt werden\",\"saveParamSuccess\":\"Gespeichert\",\"saveParamFailed\":\"Gescheiterte\",\"catalogsLoadFailed\":\"Konnte die Kataloge vom Server zu laden. Bitte versuchen Sie es erneut.\",\"paramFieldEmpty\":\"Parameter fehlt Wert\",\"contactAdmin\":\"Bitte kontaktieren Bericht Administrator um Hilfe\",\"favoriteFailed\":\"Gescheiterte\",\"docmapShowFailed\":\"Gescheiterte\",\"prepareActionFailed\":\"Gescheiterte\",\"bookmarkNotFound\":\"Können Sie nicht das Lesezeichen im Bericht\"},\"errorTag\":{\"moreDetail\":\"Klicken Sie hier für mehr Details\",\"serverError\":\"Ausnahme vom Server geworfen\",\"type\":\"Type\",\"targetSite\":\"targeSite\",\"source\":\"Ursprung\",\"message\":\"Information\",\"stackTrace\":\"StackTrace\",\"licenseErrorTitle\":\"Vielen Dank für Ihr Forerunner Software Mobilizer, scheint es ein Problem mit Ihrer Lizenz.\",\"licenseErrorContent\":\"Bitte kontaktieren Sie Ihren Systemadministrator. Wenn Sie der Administrator überprüfen Sie bitte Ihre Lizenz in der Mobilizer Konfigurationstool.\"},\"exportType\":{\"xml\":\"XML-Datei mit Daten\",\"csv\":\"CSV (Komma getrennt)\",\"pdf\":\"PDF\",\"mhtml\":\"MHTML (Web-Archiv)\",\"excel\":\"Excel\",\"tiff\":\"TIFF Datei\",\"word\":\"Word\"},\"toolPane\":{\"pageOf\":\"von\",\"home\":\"Haus\",\"navigation\":\"Navigation\",\"favorites\":\"Favoriten\",\"back\":\"Zurück\",\"refresh\":\"erfrischen\",\"docMap\":\"Dokument anzeigen\",\"find\":\"Finden\",\"next\":\"nächster\",\"zoom\":\"Zoomen\",\"print\":\"Drucken\"},\"toolbar\":{\"back\":\"Zurück\",\"docMap\":\"Dokument anzeigen\",\"exportMenu\":\"Exportieren\",\"favorites\":\"Favoriten\",\"find\":\"Finden\",\"firstPage\":\"Erste\",\"home\":\"Haus\",\"keyword\":\"Schlüsselwort\",\"lastPage\":\"Letzte\",\"menu\":\"Menü\",\"navigation\":\"Navigation\",\"next\":\"nächster\",\"pageOf\":\"von\",\"paramarea\":\"Parameter\",\"previousPage\":\"vorhergehend\",\"recent\":\"Kürzlich\",\"refresh\":\"Dieses Seite neu laden\",\"reportPage\":\"Seite\",\"zoom\":\"Aktivieren Zoomen\",\"print\":\"Drucken\",\"userSettings\":\"Fixierung\",\"saveParam\":\"Parameter speichern\"},\"print\":{\"title\":\"Drucken Seitenlayout Option\",\"pageHeight\":\"Höhe\",\"pageWidth\":\"Breite\",\"marginTop\":\"Oberteil\",\"marginBottom\":\"Unterseite\",\"marginLeft\":\"Links\",\"marginRight\":\"Richtig\",\"print\":\"Drucken\",\"cancel\":\"Stornieren\",\"unit\":\"mm\",\"margin\":\"Margins\",\"pageLayoutOptions\":\"Seitenlayoutoptionen\"},\"userSettings\":{\"title\":\"Benutzereinstellungen\",\"submit\":\"Ok\",\"cancel\":\"Stornieren\",\"ResponsiveUI\":\"Responsive UI\"},\"paramPane\":{\"nullField\":\"Null\",\"isTrue\":\"Wahr\",\"isFalse\":\"Falsch\",\"required\":\"Erforderlich\",\"viewReport\":\"Bericht anzeigen\",\"cancel\":\"stornieren\",\"datePicker\":\"Datum\"},\"validateError\":{\"required\":\"Erforderlich\",\"remote\":\"Bitte korrigieren Sie dieses Feld\",\"email\":\"Ungültige E-Mail\",\"url\":\"Ungültige URL\",\"date\":\"Ungültiges Datum\",\"dateISO\":\"Ungültiges Datum (yyyy-mm-dd)\",\"number\":\"Ungültige Nummer\",\"digits\":\"Nur Ziffern\",\"maxlength\":\"Nicht mehr als {0} Zeichen\",\"minlength\":\"Mindestens {0} Zeichen\",\"rangelength\":\"Geben Sie einen Wert zwischen {0} und {1} Zeichen lang\",\"range\":\"Geben Sie einen Wert zwischen {0} und {1}\",\"max\":\"Geben Sie einen Wert kleiner oder gleich {0}\",\"min\":\"Geben Sie einen Wert größer oder gleich {0}\"},\"dialog\":{\"title\":\"Eingabeaufforderung\",\"close\":\"schließen\"},\"placeholders\":{\"Username\":\"Benutzername\",\"Password\":\"Kennwort\",\"Login\":\"Anmelden\"},\"datepicker\":{\"closeText\":\"Fertig\",\"prevText\":\"Zurück\",\"nextText\":\"Weiter\",\"currentText\":\"Heute\",\"weekHeader\":\"Wk\",\"dateFormat\":\"mm / tt / jj\",\"firstDay\":0,\"isRTL\":false,\"showMonthAfterYear\":false,\"yearSuffix\":\"\",\"monthNames\":[\"Januar\",\"Februar\",\"März\",\"April\",\"Mai\",\"Juni\",\"Juli\",\"August\",\"September\",\"Oktober\",\"November\",\"Dezember\"],\"monthNamesShort\":[\"Jan\",\"Feb\",\"März\",\"Apr\",\"Mai\",\"Juni\",\"Juli\",\"Aug\",\"Sept\",\"Okt\",\"Nov\",\"Dez\"],\"dayNames\":[\"Sonntag\",\"Montag\",\"Dienstag\",\"Mittwoch\",\"Donnerstag\",\"Freitag\",\"Samstag\"],\"dayNamesShort\":[\"Son\",\"Mon\",\"Die\",\"Mit\",\"Don\",\"Fre\",\"Sam\"],\"dayNamesMin\":[\"So\",\"Mo\",\"Di\",\"Mi\",\"Do\",\"Fr\",\"Sa\"]}}";
            jsonString = FormatForEditing(jsonString);
        }

        private void LocTest(bool skipAddPropertyProcessing)
        {
            bool missingTranslations = false;

            // Get the localization file directory relative to the current working directory
            String locDirectory = Path.GetFullPath(Environment.CurrentDirectory + @"\..\..\..\ReportManager\Forerunner\ReportViewer\Loc");
            Assert.IsTrue(Directory.Exists(locDirectory), "locDirectory is not valid - {0}", Path.GetFullPath(locDirectory));

            // Get the exception file directory relative to the current working directory
            String exceptionFileDirectory = Path.GetFullPath(Environment.CurrentDirectory + @"\..\..\");
            Assert.IsTrue(Directory.Exists(exceptionFileDirectory), "ExceptionFileDirectory is not valid - {0}", Path.GetFullPath(locDirectory));

            // Load the translation exception file
            String exceptionFilePath = Path.Combine(exceptionFileDirectory, "LocalizationTranslationExceptions.txt");
            Assert.IsTrue(File.Exists(exceptionFilePath), "Exception File not found: {0}", exceptionFilePath);
            LocFile exceptionLocFile = new LocFile();
            exceptionLocFile.Load(exceptionFilePath);

            // Load the master (I.e., engish) file
            String masterFilePath = Path.Combine(locDirectory, @"ReportViewer-en.txt");
            Assert.IsTrue(File.Exists(masterFilePath), "masterFile: " + Path.GetFileName(masterFilePath) + " not found");

            LocFile masterLocFile = new LocFile();
            masterLocFile.Load(masterFilePath);

            // Loop through the other locals and verify against the master
            DirectoryInfo dirInfo = new DirectoryInfo(locDirectory);
            foreach (FileInfo fileInfo in dirInfo.EnumerateFiles("*.txt", SearchOption.TopDirectoryOnly))
            {
                if (fileInfo.Name.CompareTo(Path.GetFileName(masterFilePath)) == 0)
                {
                    continue;
                }

                TestContext.WriteLine("Processing file: {0}", fileInfo.Name);

                String cultureName = GetCultureName(fileInfo.Name);

                LocFile locFile = new LocFile();
                locFile.Load(fileInfo.FullName);
                ProcessResult result = masterLocFile.Process(locFile, cultureName, exceptionLocFile, IsEnglish(fileInfo.Name), skipAddPropertyProcessing, TestContext);
                missingTranslations |= (result & ProcessResult.NeedsTranslation) != 0;
                if ((result & ProcessResult.Changed) != 0)
                {
                    // Encode the locFile into a JSON string
                    var jsonString = Json.Encode(locFile);

                    // Format for editing
                    jsonString = FormatForEditing(jsonString);

                    // Write the file out
                    using (StreamWriter sw = new StreamWriter(fileInfo.FullName, false, Encoding.UTF8))
                    {
                        sw.Write(jsonString);
                    }
                }
            }

            Assert.IsFalse(missingTranslations, "One or more files need translations, see the output for more detail");
        }
    }
}
