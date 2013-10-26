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
                    if (section[pair.Key].GetType() != this[pair.Key].GetType())
                    {
                        TestContext.WriteLine("  Value type mismatch - section name: {0}, section type: {1}, master type: {2}", sectionName, section[pair.Key].GetType(), this[pair.Key].GetType());
                        result |= ProcessResult.IncompatibleTypes;
                    }
                    else if (section[pair.Key].GetType() == typeof(String) &&
                        String.Compare((String)section[pair.Key], (String)this[pair.Key], true) == 0)
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

        private void LocTest(bool skipAddPropertyProcessing)
        {
            bool missingTranslations = false;

            // Get the localization file directory relative to the current working directory
            String locDirectory = Path.GetFullPath(Environment.CurrentDirectory + @"\..\..\..\ReportManager\Forerunner\ReportViewer\Loc");
            Assert.IsTrue(Directory.Exists(locDirectory), "locDirectory is not valid");

            // Get the exception file directory relative to the current working directory
            String exceptionFileDirectory = Path.GetFullPath(Environment.CurrentDirectory + @"\..\..\");
            Assert.IsTrue(Directory.Exists(exceptionFileDirectory), "ExceptionFileDirectory is not valid");

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
                    if (jsonString.StartsWith("{"))
                    {
                        jsonString = "{\n  " + jsonString.Substring(1);
                    }
                    jsonString = jsonString.Replace("\\u0027", "'");
                    jsonString = jsonString.Replace("\":{\"", "\": {\n    \"");
                    jsonString = jsonString.Replace("\",\"", "\",\n    \"");
                    jsonString = jsonString.Replace("\"],\"", "\"],\n    \"");
                    jsonString = jsonString.Replace("\"},\"", "\"\n  },\n  \"");
                    jsonString = jsonString.Replace("}}", "\n  }\n}\n");

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
