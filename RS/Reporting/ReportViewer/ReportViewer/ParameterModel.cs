using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.Script.Serialization;

namespace Forerunner.SSRS
{
    public class ParamsList
    {
        public string Parameter { get; set; }
        public string IsMultiple { get; set; }
        public string Type { get; set; }
        public object Value { get; set; }
    }

    public class Data
    {
        public List<ParamsList> ParamsList { get; set; }
    }

    public class ParameterSet
    {
        public bool isAllUser { get; set; }
        public bool isDefault { get; set; }
        public string name { get; set; }
        public string id { get; set; }
        public Data data { get; set; }
    }

    public class ParameterModel
    {
        public enum AllUser
        {
            IsAllUser,
            NotAllUser,
            KeepDefinition
        }

        public bool canEditAllUsersSet { get; set; }
        public List<ParameterSet> parameterSets { get; set; }

        public ParameterModel()
        {
            canEditAllUsersSet = false;
            parameterSets = new List<ParameterSet>();
        }

        public string GetUserParameters()
        {
            ParameterModel model = new ParameterModel();

            model.canEditAllUsersSet = canEditAllUsersSet;
            model.parameterSets = parameterSets.FindAll(
            delegate(ParameterSet set)
            {
                return !set.isAllUser;
            });
            return model.ToJson();
        }

        public string GetAllUserParameters()
        {
            ParameterModel model = new ParameterModel();

            model.canEditAllUsersSet = canEditAllUsersSet;
            model.parameterSets = parameterSets.FindAll(
            delegate(ParameterSet set)
            {
                return set.isAllUser;
            });
            return model.ToJson();
        }

        public string ToJson()
        {
            StringBuilder buffer = new StringBuilder();
            JavaScriptSerializer serializer = new JavaScriptSerializer();
            serializer.Serialize(this, buffer);

            return buffer.ToString();
        }

        public void merge(ParameterModel newModel)
        {
            canEditAllUsersSet = canEditAllUsersSet || newModel.canEditAllUsersSet;
            parameterSets.AddRange(newModel.parameterSets);
        }

        static public ParameterModel parse(string savedParams, AllUser allUser, bool canEditAllUsersSet)
        {
            JavaScriptSerializer serializer = new JavaScriptSerializer();
            ParameterModel newModel = serializer.Deserialize<ParameterModel>(savedParams);

            newModel.canEditAllUsersSet = canEditAllUsersSet;
            if (allUser != AllUser.KeepDefinition)
            {
                foreach (ParameterSet set in newModel.parameterSets)
                {
                    set.isAllUser = allUser == AllUser.IsAllUser;
                }
            }

            return newModel;
        }
    }
}
