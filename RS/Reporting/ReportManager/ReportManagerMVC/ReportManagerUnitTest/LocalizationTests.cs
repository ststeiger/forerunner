using System;
using System.IO;
using System.Collections;
using System.Collections.Generic;
using System.Web.Helpers;
using System.Dynamic;
using System.Text;
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
        public ProcessResult Process(Section section, String sectionName, bool skipTranslationCheck, bool skipAddPropertyProcessing, TestContext TestContext)
        {
            ProcessResult result = ProcessResult.UpToDate;

            foreach (KeyValuePair<String, Object> pair in this)
            {
                if (!skipAddPropertyProcessing &&
                    !section.ContainsKey(pair.Key))
                {
                    TestContext.WriteLine("  Missing value - section: {0}, property: {1}", sectionName, pair.Key);
                    section.Add(pair.Key, pair.Value);
                    result |= ProcessResult.Changed;
                }

                if (!skipTranslationCheck)
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

            dynamic sections = Json.Decode(json);

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

        public ProcessResult Process(LocFile locFile, bool skipTranslationCheck, bool skipAddPropertyProcessing, TestContext TestContext)
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
                        ProcessResult processResult = pair.Value.Process(locFile[pair.Key], pair.Key, skipTranslationCheck, skipAddPropertyProcessing, TestContext);
                        result |= processResult;

                    }
                }
                else
                {
                    ProcessResult processResult = pair.Value.Process(locFile[pair.Key], pair.Key, skipTranslationCheck, skipAddPropertyProcessing, TestContext);
                    result |= processResult;
                }
            }

            return result;
        }
    }

    [TestClass]
    public class LocalizationTests
    {
        public TestContext TestContext { get; set; }

        private bool isEnglish(String filename)
        {
            if (filename.EndsWith("en.txt", true, System.Globalization.CultureInfo.CurrentCulture) ||
                (String.Compare(filename.Substring(filename.Length - 10, 3), "-en", true) == 0))
            {
                return true;
            }

            return false;
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

                LocFile locFile = new LocFile();
                locFile.Load(fileInfo.FullName);
                ProcessResult result = masterLocFile.Process(locFile, isEnglish(fileInfo.Name), skipAddPropertyProcessing, TestContext);
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
