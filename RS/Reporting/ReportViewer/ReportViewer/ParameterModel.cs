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
        public ParameterSet()
        {
            data = new Data();
        }

        public bool isAllUser { get; set; }
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
        public string defaultSetId { get; set; }
        public Dictionary<string, ParameterSet> parameterSets { get; set; }

        public ParameterModel()
        {
            canEditAllUsersSet = false;
            parameterSets = new Dictionary<string, ParameterSet>();
        }

        public ParameterModel(bool startingCanEditAllUsersSet)
        {
            canEditAllUsersSet = startingCanEditAllUsersSet;
            parameterSets = new Dictionary<string, ParameterSet>();
        }

        public string GetUserParameters()
        {
            ParameterModel model = new ParameterModel(canEditAllUsersSet);

            model.canEditAllUsersSet = canEditAllUsersSet;
            model.defaultSetId = defaultSetId;
            model.parameterSets = parameterSets.Where(set => !set.Value.isAllUser).ToDictionary(pair => pair.Key, pair => pair.Value);
            return model.ToJson();
        }

        public string GetAllUserParameters()
        {
            ParameterModel model = new ParameterModel(canEditAllUsersSet);

            model.canEditAllUsersSet = canEditAllUsersSet;
            model.parameterSets = parameterSets.Where(set => set.Value.isAllUser).ToDictionary(pair => pair.Key, pair => pair.Value);
            return model.ToJson();
        }

        public string ToJson()
        {
            StringBuilder buffer = new StringBuilder();
            JavaScriptSerializer serializer = new JavaScriptSerializer();
            serializer.Serialize(this, buffer);

            return buffer.ToString();
        }

        public void Merge(ParameterModel newModel)
        {
            canEditAllUsersSet = canEditAllUsersSet || newModel.canEditAllUsersSet;
            if (newModel.defaultSetId != null && newModel.defaultSetId.Length > 0)
            {
                defaultSetId = newModel.defaultSetId;
            }
            parameterSets = parameterSets.Concat(newModel.parameterSets).ToDictionary(pair => pair.Key, pair => pair.Value);
        }

        static public ParameterModel parse(string savedParams, AllUser allUser, bool canEditAllUsersSet)
        {
            JavaScriptSerializer serializer = new JavaScriptSerializer();
            ParameterModel newModel = serializer.Deserialize<ParameterModel>(savedParams);

            newModel.canEditAllUsersSet = canEditAllUsersSet;
            if (allUser != AllUser.KeepDefinition)
            {
                foreach (KeyValuePair<string, ParameterSet> pair in newModel.parameterSets)
                {
                    pair.Value.isAllUser = allUser == AllUser.IsAllUser;
                }
            }

            return newModel;
        }
    }
}
