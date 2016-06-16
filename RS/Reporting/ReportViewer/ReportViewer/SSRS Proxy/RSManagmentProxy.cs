using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net; 

namespace Forerunner.SSRS.Management
{

    public class RSManagementProxy
    {
        private bool IsNative = false;
        private Forerunner.SSRS.Management.Native.ReportingService2005 RSNative = new  Forerunner.SSRS.Management.Native.ReportingService2005();
        private Forerunner.SSRS.Management.SPS10.ReportingService2010 RSSPS = new Forerunner.SSRS.Management.SPS10.ReportingService2010();

        public RSManagementProxy(bool IsNative)
        {
            this.IsNative = IsNative;
        }

        public ItemNamespaceHeader ItemNamespaceHeaderValue
        {
            get
            {
                if (IsNative)
                    return RSNative.ItemNamespaceHeaderValue;
                else
                    return RSSPS.ItemNamespaceHeaderValue;
            }
            set
            {
                if (IsNative)
                    RSNative.ItemNamespaceHeaderValue = value;
                else
                    RSSPS.ItemNamespaceHeaderValue = value;
            }
        }

        public string Url
        {
            
            get
            {
                
                if (IsNative)
                    return RSNative.Url;
                else
                    return RSSPS.Url;    
            }
            set
            {
                if (IsNative)
                    RSNative.Url = value + "/ReportService2005.asmx";
                else
                    RSSPS.Url = value + "/ReportService2010.asmx";                
            }
        }

        public ICredentials Credentials
        {

            get
            {

                if (IsNative)
                    return RSNative.Credentials;
                else
                    return RSSPS.Credentials;
            }
            set
            {
                if (IsNative)
                    RSNative.Credentials = value;
                else
                    RSSPS.Credentials = value;
            }
        }

        public void LogonUser(string userName, string password, string authority)
        {

            if (IsNative)
                RSNative.LogonUser(userName, password, authority);
            else
                RSSPS.LogonUser(userName, password, authority);
        }

        public void Dispose()
        {
            if (IsNative)
                RSNative.Dispose();
            else
                RSSPS.Dispose();
        }

        public string[] GetPermissions(string path)
        {
            if (IsNative)
                return RSNative.GetPermissions(path);
            else
                return RSSPS.GetPermissions(path);
        }

        public byte[] GetResourceContents(string path, out string mimetype)
        {
            if (IsNative)
                return RSNative.GetResourceContents(path, out mimetype);
            else
            {
                mimetype = null;
                return RSSPS.GetItemDefinition(path);
            }
        }
        
        public byte[] GetReportDefinition(string path)
        {
            if (IsNative)
                return RSNative.GetReportDefinition(path);
            else
                return RSSPS.GetItemDefinition(path);
        }

        public ItemTypeEnum GetItemType(string path)
        {
            if (IsNative)
                return RSNative.GetItemType(path);
            else
            {
                return  (ItemTypeEnum)Enum.Parse(typeof(ItemTypeEnum), RSSPS.GetItemType(path), true);                 
            }
        }

        public Warning[] CreateReport(string Report, string Parent, bool Overwrite, byte[] Definition, Property[] Properties)
        {
            if (IsNative)
                return RSNative.CreateReport(Report, Parent, Overwrite, Definition, Properties);
            else
            {
                Warning[] warnings;
                RSSPS.CreateCatalogItem("Report", Report, Parent, Overwrite, Definition, Properties, out warnings);
                return warnings;
            }
        }

        public Warning[] SetReportDefinition(string path, byte[] definition)
        {
            if (IsNative)
                return RSNative.SetReportDefinition(path, definition);
            else
                return RSSPS.SetItemDefinition(path, definition,null);
        }

        public void SetResourceContents(string Resource, byte[] Contents, string MimeType)
        {
            if (IsNative)
                RSNative.SetResourceContents(Resource, Contents, MimeType);
            else
            {
                Property[] props = new Property[1];
                props[0] = new Property();
                props[0].Name = "mimetype";
                props[0].Value = MimeType;
                RSSPS.SetItemDefinition(Resource, Contents, null);
            }
            return;
        }
        public void DeleteItem(string path)
        {
            if (IsNative)
                RSNative.DeleteItem(path);
            else
                RSSPS.DeleteItem(path);

            return;
        }
        public void CreateResource(string Resource, string Parent, bool Overwrite, byte[] Contents, string MimeType, Property[] Properties)
        {
            if (IsNative)
                RSNative.CreateResource(Resource, Parent, Overwrite, Contents, MimeType, Properties);
            else
            {
                Warning[] warnings;
                RSSPS.CreateCatalogItem("Resource", Resource, Parent, Overwrite, Contents, Properties, out warnings);
                //return warnings;
            }                

            return;
        }
        public void CreateFolder(string Folder, string Parent, Property[] Properties)
        {
            if (IsNative)
                RSNative.CreateFolder(Folder, Parent, Properties);
            else
                RSSPS.CreateFolder(Folder, Parent, Properties);

            return;
        }
        public Property[] GetProperties(string path, Property[] props)
        {
            if (IsNative)
                return RSNative.GetProperties(path, props);
            else
                return RSSPS.GetProperties(path, props);
        }
        public void SetProperties(string path, Property[] props)
        {
            if (IsNative)
                RSNative.SetProperties(path, props);
            else
                RSSPS.SetProperties(path, props);
        }
        public CatalogItem[] ListChildren(string path, Boolean isRecursive)
        {
            if (IsNative)
                return RSNative.ListChildren(path, isRecursive);
            else
                return ConvertCatalogItem( RSSPS.ListChildren(path, isRecursive));
        }

        private CatalogItem[] ConvertCatalogItem(Forerunner.SSRS.Management.SPS10.CatalogItem[] items)
        {
            CatalogItem[] NewItems = new CatalogItem[items.Length];

            for (int i = 0; i < items.Length;i++)
            {
                NewItems[i] = new CatalogItem();
                NewItems[i].CreatedBy = items[i].CreatedBy;
                NewItems[i].CreationDate = items[i].CreationDate;
                NewItems[i].Description = items[i].Description;
                
                NewItems[i].Hidden = items[i].Hidden;
                NewItems[i].ID = items[i].ID;
                NewItems[i].ModifiedBy = items[i].ModifiedBy;
                NewItems[i].ModifiedDate = items[i].ModifiedDate;
                NewItems[i].Name = items[i].Name;
                NewItems[i].Path = items[i].Path;
                NewItems[i].Size = items[i].Size;
                NewItems[i].VirtualPath = items[i].VirtualPath;

                try
                {
                    NewItems[i].Type = (ItemTypeEnum)Enum.Parse(typeof(ItemTypeEnum), items[i].TypeName, true);
                }
                catch
                {
                    NewItems[i].Type = ItemTypeEnum.Unknown;
                }

            }

            return NewItems;
        }

        public CatalogItem[] FindItems(string folder,BooleanOperatorEnum booleanOperator, SearchCondition[] searchCriteria)
        {
            if (IsNative)
                return RSNative.FindItems(folder, booleanOperator, searchCriteria);
            else
            {
                Property[] props = new Property[1];
                props[0] = new Property();
                props[0].Name = "Resursive";
                props[0].Value = "True";

                Forerunner.SSRS.Management.SPS10.SearchCondition[] NewCond = new Forerunner.SSRS.Management.SPS10.SearchCondition[searchCriteria.Length];
                for (int i = 0; i < searchCriteria.Length; i++)
                {
                    NewCond[i] = new Forerunner.SSRS.Management.SPS10.SearchCondition();
                    NewCond[i].Condition = searchCriteria[i].Condition;
                    NewCond[i].ConditionSpecified = true;
                    NewCond[i].Name = searchCriteria[i].Name;
                    NewCond[i].Values = new string[1];
                    NewCond[i].Values[0] = searchCriteria[i].Value;
                }

                return ConvertCatalogItem(RSSPS.FindItems(folder, booleanOperator, props, NewCond));
            }
        }

        public string CreateSubscription(string Report, ExtensionSettings ExtensionSettings, string Description, string EventType, string MatchData, ParameterValue[] Parameters)
        {
            if (IsNative)
                return RSNative.CreateSubscription(Report, ExtensionSettings, Description, EventType, MatchData, Parameters);
            else
                return RSSPS.CreateSubscription(Report, ExtensionSettings, Description, EventType, MatchData, Parameters);
        }

        public ExtensionParameter[] GetExtensionSettings(string Extension)
        {
            if (IsNative)
                return RSNative.GetExtensionSettings(Extension);
            else
                return RSSPS.GetExtensionSettings(Extension);
        }

        public Extension[] ListDeliveryExtensions()
        {
            if (IsNative)
                return RSNative.ListExtensions(ExtensionTypeEnum.Delivery);
            else
            {
                Forerunner.SSRS.Management.SPS10.Extension[] ext = RSSPS.ListExtensions("Delivery");
                Extension[] NewExt = new Extension[ext.Length];
                for (int i = 0; i < ext.Length; i++)
                {
                    NewExt[i] = new Extension();
                    NewExt[i].ExtensionType = (ExtensionTypeEnum)Enum.Parse(typeof(ExtensionTypeEnum), ext[i].ExtensionTypeName, true); 
                    NewExt[i].IsModelGenerationSupported = ext[i].IsModelGenerationSupported;
                    NewExt[i].LocalizedName = ext[i].LocalizedName;
                    NewExt[i].Name = ext[i].Name;
                    NewExt[i].Visible = ext[i].Visible;
                }

                return NewExt;
            }
        }

        public Schedule[] ListSchedules(string siteName = null)
        {
            if (IsNative)
                return RSNative.ListSchedules();
            else
                return RSSPS.ListSchedules(siteName);
        }

        public string GetSubscriptionProperties(string SubscriptionID, 
            out ExtensionSettings ExtensionSettings, 
            out string Description,
            out ActiveState Active,
            out string Status,
            out string EventType,
            out string MatchData,
            out ParameterValue[] Parameters)
        {
            if (IsNative)
                return RSNative.GetSubscriptionProperties(
                    SubscriptionID,
                    out ExtensionSettings,
                    out Description,
                    out Active,
                    out Status,
                    out EventType,
                    out MatchData,
                    out Parameters);
            else
                return RSSPS.GetSubscriptionProperties(
                    SubscriptionID,
                    out ExtensionSettings,
                    out Description,
                    out Active,
                    out Status,
                    out EventType,
                    out MatchData,
                    out Parameters);
        }

        public void SetSubscriptionProperties(string SubscriptionID,
            ExtensionSettings ExtensionSettings,
            string Description,
            string EventType,
            string MatchData,
            ParameterValue[] Parameters)
        {
            if (IsNative)
                RSNative.SetSubscriptionProperties(
                    SubscriptionID,
                    ExtensionSettings,
                    Description,
                    EventType,
                    MatchData,
                    Parameters
                    );
            else
                RSSPS.SetSubscriptionProperties(
                    SubscriptionID,
                    ExtensionSettings,
                    Description,
                    EventType,
                    MatchData,
                    Parameters
                    );
        }

        public Subscription[] ListSubscriptions(string Report, string Owner)
        {
            if (IsNative)
                return RSNative.ListSubscriptions(Report, Owner);
            else
                return RSSPS.ListMySubscriptions(Report); 
        }

        public void DeleteSubscription(string SubscriptionID)
        {
            if (IsNative)
                RSNative.DeleteSubscription(SubscriptionID);
            else
                RSSPS.DeleteSubscription(SubscriptionID);
        }

        public Policy[] GetPolicies(string itemPath, out bool inheritParent)
        {
            if (IsNative)
                return RSNative.GetPolicies(itemPath, out inheritParent);
            else
                return RSSPS.GetPolicies(itemPath, out inheritParent);
        }

        public void SetPolicies(string itemPath, Policy[] policies)
        {
            if (IsNative)
                RSNative.SetPolicies(itemPath, policies);
            else
            {
                try
                {
                    RSSPS.SetPolicies(itemPath, policies);
                }
                catch (Exception e)
                {
                    //Ignore this error.  SSRS and RS doe not pla nice with some permissions
                    if (e.Message.IndexOf("empty role definition") <0)
                        throw e;
                }
            }
            return;
        }

        public Role[] ListRoles(string type, string itemPath)
        {
            if (IsNative)
            {
                SecurityScopeEnum securityScope = (SecurityScopeEnum)Enum.Parse(typeof(SecurityScopeEnum), type, true);

                return RSNative.ListRoles(securityScope);
            }
            else
            {
                SecurityScopeEnum securityScope = (SecurityScopeEnum)Enum.Parse(typeof(SecurityScopeEnum), type, true);

                return RSSPS.ListRoles(type, itemPath);
            }
        }

        public void InheridParentSecurity(string itemPath)
        {
            if (IsNative)
                RSNative.InheritParentSecurity(itemPath);
            else
                RSSPS.InheritParentSecurity(itemPath);

            return;
        }

        public void CreateLinkedReport(string linkedReportName, string parentPath, string link, Property[] properties)
        {
            if (IsNative)
            {
                RSNative.CreateLinkedReport(linkedReportName, parentPath, link, properties);
            }
            else
            {
                RSSPS.CreateLinkedItem(linkedReportName, parentPath, link, properties);
            }
        }

        public string GetReportLink(string linkedReportPath)
        {
            if (IsNative)
            {
                return RSNative.GetReportLink(linkedReportPath);
            }
            else
            {
                return RSSPS.GetItemLink(linkedReportPath);
            }
        }

        public void SetReportLink(string linkedReportPath, string link)
        {
            if (IsNative)
            {
                RSNative.SetReportLink(linkedReportPath, link);
            }
            else
            {
                RSSPS.SetItemLink(linkedReportPath, link);
            }
        }

        public void MoveItem(string curFullPath, string newFullPath)
        {
            if (IsNative)
            {
                RSNative.MoveItem(curFullPath, newFullPath);
            }
            else
            {
                RSSPS.MoveItem(curFullPath, newFullPath);
            }
        }
    }
}
