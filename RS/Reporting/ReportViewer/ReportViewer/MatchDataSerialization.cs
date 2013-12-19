using System;
using System.Collections.Generic;
using System.Xml;
using System.IO;
using System.Xml.Serialization;
using System.Globalization;
using Forerunner.SSRS.Management;

namespace Forerunner.Subscription
{
    public class MatchDataSerialization
    {
        static public XmlDocument GetScheduleAsXml(ScheduleDefinition schedule)
        {
            MemoryStream buffer = new MemoryStream();
            XmlSerializer xmlSerializer = new XmlSerializer(typeof(ScheduleDefinition));
            xmlSerializer.Serialize(buffer, schedule);
            buffer.Seek(0, SeekOrigin.Begin);

            XmlDocument doc = new XmlDocument();
            doc.Load(buffer);
            // patch up WhichWeek
            XmlNamespaceManager ns = new XmlNamespaceManager(doc.NameTable);
            ns.AddNamespace("rs",
                    "http://schemas.microsoft.com/sqlserver/2003/12/reporting/reportingservices");

            XmlNode node =
                doc.SelectSingleNode(
                     "/ScheduleDefinition/rs:MonthlyDOWRecurrence/rs:WhichWeek", ns
                );
            if (node != null)
            {
                switch (node.InnerXml)
                {
                    case "FirstWeek":
                        node.InnerXml = "FIRST_WEEK"; break;
                    case "SecondWeek":
                        node.InnerXml = "SECOND_WEEK"; break;
                    case "ThirdWeek":
                        node.InnerXml = "THIRD_WEEK"; break;
                    case "FourthWeek":
                        node.InnerXml = "FOURTH_WEEK"; break;
                    case "LastWeek":
                        node.InnerXml = "LAST_WEEK"; break;
                }
            }

            return doc;
        }

        static public string GetMatchDataFromScheduleReference(ScheduleReference reference)
        {
            if (reference.Definition != null)
                return GetScheduleAsXml(reference.Definition).OuterXml;

            return reference.ScheduleID;
        }

        static public ScheduleReference GetScheduleFromMatchData(string matchData)
        {
            ScheduleReference retVal = new ScheduleReference();
            ScheduleDefinition definition = null;
            try
            {
                definition = GetScheduleDefinition(matchData);
            }
            catch
            {
            }
            if (definition == null)
            {
                retVal.ScheduleID = matchData;
            }
            else
            {
                retVal.Definition = definition;
            }
            return retVal;
        }

        static private XmlAttributeOverrides GetScheduleOverrides()
        {
            XmlAttributeOverrides overrides = new XmlAttributeOverrides();
            XmlAttributes attrs = new XmlAttributes();
            attrs.Xmlns = false;
            overrides.Add(typeof(ScheduleDefinition), attrs);
            overrides.Add(typeof(MinuteRecurrence), attrs);
            overrides.Add(typeof(WeeklyRecurrence), attrs);
            overrides.Add(typeof(MonthlyRecurrence), attrs);
            overrides.Add(typeof(MonthlyDOWRecurrence), attrs);
            overrides.Add(typeof(DaysOfWeekSelector), attrs);
            overrides.Add(typeof(MonthsOfYearSelector), attrs);
            return overrides;
        }

        static public bool IsEmpty(string s)
        {
            return (s == null || s == String.Empty);
        }

        static public ScheduleDefinition GetScheduleDefinition(string matchData)
        {
            ScheduleDefinition res = null;

            if (!IsEmpty(matchData))
            {
                string endDateStart = "<EndDate>";
                string endDateEnd = "</EndDate>";
                string scheduleString = matchData;
                string endDateString = string.Empty;
                // 1. Find <EndDate> tag and parse it separately, because it is not serialized correctly by Microsoft.
                int posStart = matchData.IndexOf(endDateStart);
                int posEnd = matchData.IndexOf(endDateEnd);

                if (posStart != -1 && posEnd != -1)
                {
                    endDateString = scheduleString.Substring(
                        posStart + endDateStart.Length,
                        posEnd - posStart - endDateStart.Length);

                    scheduleString =
                        scheduleString.Substring(0, posStart)
                        + scheduleString.Substring(
                        posEnd + endDateEnd.Length,
                        scheduleString.Length - posEnd -
                        endDateEnd.Length);
                }

                // 2. Replace True/False on true/false.
                scheduleString = scheduleString.Replace(">True</", ">true</");

                scheduleString = scheduleString.Replace(">False</", ">false</");

                // 2.1 Replace occurrences of which week item on serialized correct value:

                for (int i = 0; i < WHICH_WEEK_ENUM.Length; i++)
                    scheduleString = scheduleString.Replace(WHICH_WEEK_STRINGS[i], WHICH_WEEK_ENUM[i]);

                scheduleString = scheduleString.Replace("encoding=\"utf-16\"", "");
                scheduleString = scheduleString.Replace("xmlns=\"http://schemas.microsoft.com/sqlserver/2005/06/30/reporting/reportingservices\"", "");

                // 3. Deserialize ScheduleDefinition.
                Stream stream = null;
                XmlReader xmlReader = null;

                try
                {
                    // set overrides options to pass namespace tag during deserialization:
                    XmlAttributeOverrides overrides = GetScheduleOverrides();
                    //stream = new MemoryStream(System.Text.Encoding.Default.GetBytes(scheduleString));
                    //xmlReader = new XmlTextReader(stream);
                    XmlDocument xmlDocument = new XmlDocument();
                    xmlDocument.LoadXml(scheduleString);

                    stream = new MemoryStream(System.Text.Encoding.Default.GetBytes(xmlDocument.OuterXml));
                    xmlReader = new XmlTextReader(stream);

                    XmlSerializer ser = new XmlSerializer(typeof(ScheduleDefinition), overrides);
                    res = (ScheduleDefinition)ser.Deserialize(xmlReader);
                }
                finally
                {
                    if (xmlReader != null) xmlReader.Close();
                    if (stream != null) stream.Close();
                }

                if (res == null)
                    res = new ScheduleDefinition();

                // 4. Parse EndDate.
                DateTime endDate = DateTime.Today;
                if (!IsEmpty(endDateString))
                {
                    IFormatProvider culture = new CultureInfo("en-US", true);
                    endDate = DateTime.Parse(endDateString, culture);
                    res.EndDate = endDate;
                    res.EndDateSpecified = true;
                }
                else
                {
                    res.EndDateSpecified = false;
                }

            }

            if (res == null)
            {
                res = new ScheduleDefinition();
                res.StartDateTime = DateTime.Today;
                res.EndDateSpecified = false;
            }

            return res;

        }

        static private string[] WHICH_WEEK_STRINGS = new string[] {
            "FIRST_WEEK",
            "SECOND_WEEK",
            "THIRD_WEEK",
            "FOURTH_WEEK",
            "LAST_WEEK"
            };

        static private string[] WHICH_WEEK_ENUM = new string[] {
            WeekNumberEnum.FirstWeek.ToString(),
            WeekNumberEnum.SecondWeek.ToString(),
            WeekNumberEnum.ThirdWeek.ToString(),
            WeekNumberEnum.FourthWeek.ToString(),
            WeekNumberEnum.LastWeek.ToString()};
    }
}
