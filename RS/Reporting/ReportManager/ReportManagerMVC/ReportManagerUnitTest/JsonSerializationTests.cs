using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Web.Script.Serialization;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Reflection;
using Forerunner.SSRS;

namespace ReportManagerUnitTest
{
    [TestClass]
    // JsonSerializationTests contains various test that demonstrate capabilities of JavaScriptSerializer
    public class JsonSerializationTests
    {
        // Test data
        static string SimpleJson = "{\"id\":\"13\", \"value\": \"foo\"}";
        static string ParamterModelJson = "{\"canEditAllUsersSet\":true,\"defaultSetId\":\"cf536b40-8f4a-07f8-14d0-b68a151a5720\",\"parameterSets\":{\"cf536b40-8f4a-07f8-14d0-b68a151a5720\":{\"isAllUser\":false,\"name\":\"Default\",\"id\":\"cf536b40-8f4a-07f8-14d0-b68a151a5720\",\"data\":{\"ParamsList\":[{\"Parameter\":\"ProductName\",\"IsMultiple\":\"false\",\"Type\":\"String\",\"Value\":null},{\"Parameter\":\"ProductionDate\",\"IsMultiple\":\"false\",\"Type\":\"DateTime\",\"Value\":\"2013-12-02\"},{\"Parameter\":\"IntegerTest\",\"IsMultiple\":\"false\",\"Type\":\"Integer\",\"Value\":\"2\"},{\"Parameter\":\"FloatTest\",\"IsMultiple\":\"false\",\"Type\":\"Float\",\"Value\":\"2\"},{\"Parameter\":\"MultipleValues\",\"IsMultiple\":\"true\",\"Type\":\"String\",\"Value\":[\"2\"]},{\"Parameter\":\"CategoryID\",\"IsMultiple\":\"false\",\"Type\":\"String\",\"Value\":\"2\"},{\"Parameter\":\"IsCheap\",\"IsMultiple\":\"\",\"Type\":\"Boolean\",\"Value\":\"True\"}]}},\"8debfebd-8ce7-1d13-852b-f884892144e7\":{\"isAllUser\":false,\"name\":\"S2\",\"id\":\"8debfebd-8ce7-1d13-852b-f884892144e7\",\"data\":{\"ParamsList\":[{\"Parameter\":\"ProductName\",\"IsMultiple\":\"false\",\"Type\":\"String\",\"Value\":null},{\"Parameter\":\"ProductionDate\",\"IsMultiple\":\"false\",\"Type\":\"DateTime\",\"Value\":\"2013-12-01\"},{\"Parameter\":\"IntegerTest\",\"IsMultiple\":\"false\",\"Type\":\"Integer\",\"Value\":\"1\"},{\"Parameter\":\"FloatTest\",\"IsMultiple\":\"false\",\"Type\":\"Float\",\"Value\":\"1\"},{\"Parameter\":\"MultipleValues\",\"IsMultiple\":\"true\",\"Type\":\"String\",\"Value\":null},{\"Parameter\":\"CategoryID\",\"IsMultiple\":\"false\",\"Type\":\"String\",\"Value\":\"1\"},{\"Parameter\":\"IsCheap\",\"IsMultiple\":\"\",\"Type\":\"Boolean\",\"Value\":\"True\"}]}}},\"Serialize\":1}";

        private Object DeserializeDynamicMap(string json)
        {
            JavaScriptSerializer serializer = new JavaScriptSerializer();
            var map = serializer.Deserialize<dynamic>(json);
            return map;
        }

        private void SerializeObject(Object obj)
        {
            JavaScriptSerializer serializer = new JavaScriptSerializer();
            string jsonOut = serializer.Serialize(obj);
            Assert.IsTrue(jsonOut.Length > 0);
        }

        [TestMethod]
        /// <summary>
        /// Demonstrates / tests a JavaScripConvert class that skips fields on output
        /// </summary>
        /// <returns></returns>
        public void CustomConverterTest()
        {
            JavaScriptSerializer serializer = new JavaScriptSerializer();
            ParameterModel parameterModel = serializer.Deserialize<ParameterModel>(ParamterModelJson);
            string[] skipFields = { "canEditAllUsersSet", "isAllUser" };
            Type[] types = { typeof(ParameterModel), typeof(ParameterSet) };
            serializer.RegisterConverters(new JavaScriptConverter[] { new SkipFieldsConverter(skipFields, types) });
            string jsonOut = serializer.Serialize(parameterModel);
            Assert.IsTrue(jsonOut.Length > 0);
        }

        [TestMethod]
        /// <summary>
        /// Deserialize and serialize the ParameterModel object notation
        /// 
        /// Requires .NET version 4.0 or higher because of the use of the Dynamic Language Runtime.
        /// See the topic here: http://msdn.microsoft.com/en-us/library/dd233052(v=vs.100).aspx
        /// </summary>
        /// <returns></returns>
        public void DynamicParameterModelTest()
        {
            var parameterModel = (dynamic)DeserializeDynamicMap(ParamterModelJson);
            Assert.IsTrue(parameterModel["canEditAllUsersSet"]);
            Assert.IsTrue(parameterModel["parameterSets"]["cf536b40-8f4a-07f8-14d0-b68a151a5720"]["data"]["ParamsList"].Length == 7);

            SerializeObject(parameterModel);
        }

        [TestMethod]
        /// <summary>
        /// Tests / demonstrate a dynamically created Object being serialized to a json string
        /// 
        /// Requires .NET version 4.0 or higher because of the use of the Dynamic Language Runtime.
        /// See the topic here: http://msdn.microsoft.com/en-us/library/dd233052(v=vs.100).aspx
        /// </summary>
        /// <returns></returns>
        public void SerializeDynamicMapTest()
        {
            var map = (dynamic)DeserializeDynamicMap(SimpleJson);

            SerializeObject(map);
        }

        [TestMethod]
        /// <summary>
        /// Tests / demonstrates a dynamically created dictionary object created via the JavaScriptSerializer
        /// 
        /// Requires .NET version 4.0 or higher because of the use of the Dynamic Language Runtime.
        /// See the topic here: http://msdn.microsoft.com/en-us/library/dd233052(v=vs.100).aspx
        /// </summary>
        /// <returns></returns>
        public void DynamicMapDeserializeTest()
        {
            var map = (dynamic)DeserializeDynamicMap(SimpleJson);
            Assert.AreEqual(map["id"], "13");
        }
    }
}
