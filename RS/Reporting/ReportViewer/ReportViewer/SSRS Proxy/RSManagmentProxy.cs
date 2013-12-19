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
        private Forerunner.SSRS.Management.SPS.ReportingService2006 RSSPS = new Forerunner.SSRS.Management.SPS.ReportingService2006();

        public RSManagementProxy(bool IsNative)
        {
            this.IsNative = IsNative;
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
                    RSSPS.Url = value + "/ReportService2006.asmx";                
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


        public Property[] GetProperties(string path, Property[] props)
        {
            if (IsNative)
                return RSNative.GetProperties(path, props);
            else
                return RSSPS.GetProperties(path, props);
        }

        public CatalogItem[] ListChildren(string path, Boolean isRecursive)
        {
            if (IsNative)
                return RSNative.ListChildren(path, isRecursive);
            else
                return RSSPS.ListChildren(path);
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
                return RSSPS.ListExtensions(ExtensionTypeEnum.Delivery);
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
            // BUGBUG:  Need to have a way to detect 2010 SharePoint endpoints
                return null;
        }

        public void DeleteSubscription(string SubscriptionID)
        {
            if (IsNative)
                RSNative.DeleteSubscription(SubscriptionID);
            else
                RSSPS.DeleteSubscription(SubscriptionID);
        }
    }
}
