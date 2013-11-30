using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Web.Script.Serialization;

namespace ReportManagerUnitTest
{
    [TestClass]
    public class JsonSerializationTests
    {
        [TestMethod]
        public void TestMethod1()
        {
            string json = "{\"id\":\"13\", \"value\": \"foo\"}";
            JavaScriptSerializer serializer = new JavaScriptSerializer();
            var map = serializer.Deserialize<dynamic>(json);
        }
    }
}
