using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Serialization;
using System.Runtime.Serialization;

namespace Forerunner.SSRS.Management
{

   
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    ////[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
   //[System.Xml.Serialization.XmlRootAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices", IsNullable = false)]
    public partial class ServerInfoHeader : System.Web.Services.Protocols.SoapHeader
    {

        private string reportServerVersionNumberField;

        private string reportServerEditionField;

        private string reportServerVersionField;

        private string reportServerDateTimeField;

        private TimeZoneInformation reportServerTimeZoneInfoField;

        private System.Xml.XmlAttribute[] anyAttrField;

        /// <remarks/>
        public string ReportServerVersionNumber
        {
            get
            {
                return this.reportServerVersionNumberField;
            }
            set
            {
                this.reportServerVersionNumberField = value;
            }
        }

        /// <remarks/>
        public string ReportServerEdition
        {
            get
            {
                return this.reportServerEditionField;
            }
            set
            {
                this.reportServerEditionField = value;
            }
        }

        /// <remarks/>
        public string ReportServerVersion
        {
            get
            {
                return this.reportServerVersionField;
            }
            set
            {
                this.reportServerVersionField = value;
            }
        }

        /// <remarks/>
        public string ReportServerDateTime
        {
            get
            {
                return this.reportServerDateTimeField;
            }
            set
            {
                this.reportServerDateTimeField = value;
            }
        }

        /// <remarks/>
        public TimeZoneInformation ReportServerTimeZoneInfo
        {
            get
            {
                return this.reportServerTimeZoneInfoField;
            }
            set
            {
                this.reportServerTimeZoneInfoField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlAnyAttributeAttribute()]
        public System.Xml.XmlAttribute[] AnyAttr
        {
            get
            {
                return this.anyAttrField;
            }
            set
            {
                this.anyAttrField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    ////[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class TimeZoneInformation
    {

        private int biasField;

        private int standardBiasField;

        private SYSTEMTIME standardDateField;

        private int daylightBiasField;

        private SYSTEMTIME daylightDateField;

        /// <remarks/>
        public int Bias
        {
            get
            {
                return this.biasField;
            }
            set
            {
                this.biasField = value;
            }
        }

        /// <remarks/>
        public int StandardBias
        {
            get
            {
                return this.standardBiasField;
            }
            set
            {
                this.standardBiasField = value;
            }
        }

        /// <remarks/>
        public SYSTEMTIME StandardDate
        {
            get
            {
                return this.standardDateField;
            }
            set
            {
                this.standardDateField = value;
            }
        }

        /// <remarks/>
        public int DaylightBias
        {
            get
            {
                return this.daylightBiasField;
            }
            set
            {
                this.daylightBiasField = value;
            }
        }

        /// <remarks/>
        public SYSTEMTIME DaylightDate
        {
            get
            {
                return this.daylightDateField;
            }
            set
            {
                this.daylightDateField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class SYSTEMTIME
    {

        private short yearField;

        private short monthField;

        private short dayOfWeekField;

        private short dayField;

        private short hourField;

        private short minuteField;

        private short secondField;

        private short millisecondsField;

        /// <remarks/>
        public short year
        {
            get
            {
                return this.yearField;
            }
            set
            {
                this.yearField = value;
            }
        }

        /// <remarks/>
        public short month
        {
            get
            {
                return this.monthField;
            }
            set
            {
                this.monthField = value;
            }
        }

        /// <remarks/>
        public short dayOfWeek
        {
            get
            {
                return this.dayOfWeekField;
            }
            set
            {
                this.dayOfWeekField = value;
            }
        }

        /// <remarks/>
        public short day
        {
            get
            {
                return this.dayField;
            }
            set
            {
                this.dayField = value;
            }
        }

        /// <remarks/>
        public short hour
        {
            get
            {
                return this.hourField;
            }
            set
            {
                this.hourField = value;
            }
        }

        /// <remarks/>
        public short minute
        {
            get
            {
                return this.minuteField;
            }
            set
            {
                this.minuteField = value;
            }
        }

        /// <remarks/>
        public short second
        {
            get
            {
                return this.secondField;
            }
            set
            {
                this.secondField = value;
            }
        }

        /// <remarks/>
        public short milliseconds
        {
            get
            {
                return this.millisecondsField;
            }
            set
            {
                this.millisecondsField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ModelDrillthroughReport
    {

        private string pathField;

        private DrillthroughType typeField;

        /// <remarks/>
        public string Path
        {
            get
            {
                return this.pathField;
            }
            set
            {
                this.pathField = value;
            }
        }

        /// <remarks/>
        public DrillthroughType Type
        {
            get
            {
                return this.typeField;
            }
            set
            {
                this.typeField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public enum DrillthroughType
    {

        /// <remarks/>
        Detail,

        /// <remarks/>
        List,
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ModelItem
    {

        private string idField;

        private string nameField;

        private ModelItemTypeEnum typeField;

        private string descriptionField;

        private ModelItem[] modelItemsField;

        /// <remarks/>
        public string ID
        {
            get
            {
                return this.idField;
            }
            set
            {
                this.idField = value;
            }
        }

        /// <remarks/>
        public string Name
        {
            get
            {
                return this.nameField;
            }
            set
            {
                this.nameField = value;
            }
        }

        /// <remarks/>
        public ModelItemTypeEnum Type
        {
            get
            {
                return this.typeField;
            }
            set
            {
                this.typeField = value;
            }
        }

        /// <remarks/>
        public string Description
        {
            get
            {
                return this.descriptionField;
            }
            set
            {
                this.descriptionField = value;
            }
        }

        /// <remarks/>
        public ModelItem[] ModelItems
        {
            get
            {
                return this.modelItemsField;
            }
            set
            {
                this.modelItemsField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public enum ModelItemTypeEnum
    {

        /// <remarks/>
        Model,

        /// <remarks/>
        EntityFolder,

        /// <remarks/>
        FieldFolder,

        /// <remarks/>
        Entity,

        /// <remarks/>
        Attribute,

        /// <remarks/>
        Role,
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ModelPerspective
    {

        private string idField;

        private string nameField;

        private string descriptionField;

        /// <remarks/>
        public string ID
        {
            get
            {
                return this.idField;
            }
            set
            {
                this.idField = value;
            }
        }

        /// <remarks/>
        public string Name
        {
            get
            {
                return this.nameField;
            }
            set
            {
                this.nameField = value;
            }
        }

        /// <remarks/>
        public string Description
        {
            get
            {
                return this.descriptionField;
            }
            set
            {
                this.descriptionField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ModelCatalogItem
    {

        private string modelField;

        private string descriptionField;

        private ModelPerspective[] perspectivesField;

        /// <remarks/>
        public string Model
        {
            get
            {
                return this.modelField;
            }
            set
            {
                this.modelField = value;
            }
        }

        /// <remarks/>
        public string Description
        {
            get
            {
                return this.descriptionField;
            }
            set
            {
                this.descriptionField = value;
            }
        }

        /// <remarks/>
        public ModelPerspective[] Perspectives
        {
            get
            {
                return this.perspectivesField;
            }
            set
            {
                this.perspectivesField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class Policy
    {

        private string groupUserNameField;

        private Role[] rolesField;

        /// <remarks/>
        public string GroupUserName
        {
            get
            {
                return this.groupUserNameField;
            }
            set
            {
                this.groupUserNameField = value;
            }
        }

        /// <remarks/>
        public Role[] Roles
        {
            get
            {
                return this.rolesField;
            }
            set
            {
                this.rolesField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class Role
    {

        private string nameField;

        private string descriptionField;

        /// <remarks/>
        public string Name
        {
            get
            {
                return this.nameField;
            }
            set
            {
                this.nameField = value;
            }
        }

        /// <remarks/>
        public string Description
        {
            get
            {
                return this.descriptionField;
            }
            set
            {
                this.descriptionField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class Task
    {

        private string taskIDField;

        private string nameField;

        private string descriptionField;

        /// <remarks/>
        public string TaskID
        {
            get
            {
                return this.taskIDField;
            }
            set
            {
                this.taskIDField = value;
            }
        }

        /// <remarks/>
        public string Name
        {
            get
            {
                return this.nameField;
            }
            set
            {
                this.nameField = value;
            }
        }

        /// <remarks/>
        public string Description
        {
            get
            {
                return this.descriptionField;
            }
            set
            {
                this.descriptionField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class Event
    {

        private string typeField;

        /// <remarks/>
        public string Type
        {
            get
            {
                return this.typeField;
            }
            set
            {
                this.typeField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class Extension
    {

        private ExtensionTypeEnum extensionTypeField;

        private string nameField;

        private string localizedNameField;

        private bool visibleField;

        private bool isModelGenerationSupportedField;

        /// <remarks/>
        public ExtensionTypeEnum ExtensionType
        {
            get
            {
                return this.extensionTypeField;
            }
            set
            {
                this.extensionTypeField = value;
            }
        }

        /// <remarks/>
        public string Name
        {
            get
            {
                return this.nameField;
            }
            set
            {
                this.nameField = value;
            }
        }

        /// <remarks/>
        public string LocalizedName
        {
            get
            {
                return this.localizedNameField;
            }
            set
            {
                this.localizedNameField = value;
            }
        }

        /// <remarks/>
        public bool Visible
        {
            get
            {
                return this.visibleField;
            }
            set
            {
                this.visibleField = value;
            }
        }

        /// <remarks/>
        public bool IsModelGenerationSupported
        {
            get
            {
                return this.isModelGenerationSupportedField;
            }
            set
            {
                this.isModelGenerationSupportedField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public enum ExtensionTypeEnum
    {

        /// <remarks/>
        Delivery,

        /// <remarks/>
        Render,

        /// <remarks/>
        Data,

        /// <remarks/>
        All,
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class Subscription
    {

        private string subscriptionIDField;

        private string ownerField;

        private string pathField;

        private string virtualPathField;

        private string reportField;

        private ExtensionSettings deliverySettingsField;

        private string descriptionField;

        private string statusField;

        private ActiveState activeField;

        private System.DateTime lastExecutedField;

        private bool lastExecutedFieldSpecified;

        private string modifiedByField;

        private System.DateTime modifiedDateField;

        private string eventTypeField;

        private bool isDataDrivenField;

        /// <remarks/>
        public string SubscriptionID
        {
            get
            {
                return this.subscriptionIDField;
            }
            set
            {
                this.subscriptionIDField = value;
            }
        }

        /// <remarks/>
        public string Owner
        {
            get
            {
                return this.ownerField;
            }
            set
            {
                this.ownerField = value;
            }
        }

        /// <remarks/>
        public string Path
        {
            get
            {
                return this.pathField;
            }
            set
            {
                this.pathField = value;
            }
        }

        /// <remarks/>
        public string VirtualPath
        {
            get
            {
                return this.virtualPathField;
            }
            set
            {
                this.virtualPathField = value;
            }
        }

        /// <remarks/>
        public string Report
        {
            get
            {
                return this.reportField;
            }
            set
            {
                this.reportField = value;
            }
        }

        /// <remarks/>
        public ExtensionSettings DeliverySettings
        {
            get
            {
                return this.deliverySettingsField;
            }
            set
            {
                this.deliverySettingsField = value;
            }
        }

        /// <remarks/>
        public string Description
        {
            get
            {
                return this.descriptionField;
            }
            set
            {
                this.descriptionField = value;
            }
        }

        /// <remarks/>
        public string Status
        {
            get
            {
                return this.statusField;
            }
            set
            {
                this.statusField = value;
            }
        }

        /// <remarks/>
        public ActiveState Active
        {
            get
            {
                return this.activeField;
            }
            set
            {
                this.activeField = value;
            }
        }

        /// <remarks/>
        public System.DateTime LastExecuted
        {
            get
            {
                return this.lastExecutedField;
            }
            set
            {
                this.lastExecutedField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool LastExecutedSpecified
        {
            get
            {
                return this.lastExecutedFieldSpecified;
            }
            set
            {
                this.lastExecutedFieldSpecified = value;
            }
        }

        /// <remarks/>
        public string ModifiedBy
        {
            get
            {
                return this.modifiedByField;
            }
            set
            {
                this.modifiedByField = value;
            }
        }

        /// <remarks/>
        public System.DateTime ModifiedDate
        {
            get
            {
                return this.modifiedDateField;
            }
            set
            {
                this.modifiedDateField = value;
            }
        }

        /// <remarks/>
        public string EventType
        {
            get
            {
                return this.eventTypeField;
            }
            set
            {
                this.eventTypeField = value;
            }
        }

        /// <remarks/>
        public bool IsDataDriven
        {
            get
            {
                return this.isDataDrivenField;
            }
            set
            {
                this.isDataDrivenField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ExtensionSettings
    {

        private string extensionField;

        private ParameterValueOrFieldReference[] parameterValuesField;

        /// <remarks/>
        public string Extension
        {
            get
            {
                return this.extensionField;
            }
            set
            {
                this.extensionField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlArrayItemAttribute(typeof(ParameterFieldReference))]
        [System.Xml.Serialization.XmlArrayItemAttribute(typeof(ParameterValue))]
        public ParameterValueOrFieldReference[] ParameterValues
        {
            get
            {
                return this.parameterValuesField;
            }
            set
            {
                this.parameterValuesField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ParameterFieldReference : ParameterValueOrFieldReference
    {

        private string parameterNameField;

        private string fieldAliasField;

        /// <remarks/>
        public string ParameterName
        {
            get
            {
                return this.parameterNameField;
            }
            set
            {
                this.parameterNameField = value;
            }
        }

        /// <remarks/>
        public string FieldAlias
        {
            get
            {
                return this.fieldAliasField;
            }
            set
            {
                this.fieldAliasField = value;
            }
        }
    }

    /// <remarks/>
    [System.Xml.Serialization.XmlIncludeAttribute(typeof(ParameterFieldReference))]
    [System.Xml.Serialization.XmlIncludeAttribute(typeof(ParameterValue))]
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ParameterValueOrFieldReference
    {
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ParameterValue : ParameterValueOrFieldReference
    {

        private string nameField;

        private string valueField;

        private string labelField;

        /// <remarks/>
        public string Name
        {
            get
            {
                return this.nameField;
            }
            set
            {
                this.nameField = value;
            }
        }

        /// <remarks/>
        public string Value
        {
            get
            {
                return this.valueField;
            }
            set
            {
                this.valueField = value;
            }
        }

        /// <remarks/>
        public string Label
        {
            get
            {
                return this.labelField;
            }
            set
            {
                this.labelField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ActiveState
    {

        private bool deliveryExtensionRemovedField;

        private bool deliveryExtensionRemovedFieldSpecified;

        private bool sharedDataSourceRemovedField;

        private bool sharedDataSourceRemovedFieldSpecified;

        private bool missingParameterValueField;

        private bool missingParameterValueFieldSpecified;

        private bool invalidParameterValueField;

        private bool invalidParameterValueFieldSpecified;

        private bool unknownReportParameterField;

        private bool unknownReportParameterFieldSpecified;

        /// <remarks/>
        public bool DeliveryExtensionRemoved
        {
            get
            {
                return this.deliveryExtensionRemovedField;
            }
            set
            {
                this.deliveryExtensionRemovedField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool DeliveryExtensionRemovedSpecified
        {
            get
            {
                return this.deliveryExtensionRemovedFieldSpecified;
            }
            set
            {
                this.deliveryExtensionRemovedFieldSpecified = value;
            }
        }

        /// <remarks/>
        public bool SharedDataSourceRemoved
        {
            get
            {
                return this.sharedDataSourceRemovedField;
            }
            set
            {
                this.sharedDataSourceRemovedField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool SharedDataSourceRemovedSpecified
        {
            get
            {
                return this.sharedDataSourceRemovedFieldSpecified;
            }
            set
            {
                this.sharedDataSourceRemovedFieldSpecified = value;
            }
        }

        /// <remarks/>
        public bool MissingParameterValue
        {
            get
            {
                return this.missingParameterValueField;
            }
            set
            {
                this.missingParameterValueField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool MissingParameterValueSpecified
        {
            get
            {
                return this.missingParameterValueFieldSpecified;
            }
            set
            {
                this.missingParameterValueFieldSpecified = value;
            }
        }

        /// <remarks/>
        public bool InvalidParameterValue
        {
            get
            {
                return this.invalidParameterValueField;
            }
            set
            {
                this.invalidParameterValueField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool InvalidParameterValueSpecified
        {
            get
            {
                return this.invalidParameterValueFieldSpecified;
            }
            set
            {
                this.invalidParameterValueFieldSpecified = value;
            }
        }

        /// <remarks/>
        public bool UnknownReportParameter
        {
            get
            {
                return this.unknownReportParameterField;
            }
            set
            {
                this.unknownReportParameterField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool UnknownReportParameterSpecified
        {
            get
            {
                return this.unknownReportParameterFieldSpecified;
            }
            set
            {
                this.unknownReportParameterFieldSpecified = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ExtensionParameter
    {

        private string nameField;

        private string displayNameField;

        private bool requiredField;

        private bool requiredFieldSpecified;

        private bool readOnlyField;

        private string valueField;

        private string errorField;

        private bool encryptedField;

        private bool isPasswordField;

        private ValidValue[] validValuesField;

        /// <remarks/>
        public string Name
        {
            get
            {
                return this.nameField;
            }
            set
            {
                this.nameField = value;
            }
        }

        /// <remarks/>
        public string DisplayName
        {
            get
            {
                return this.displayNameField;
            }
            set
            {
                this.displayNameField = value;
            }
        }

        /// <remarks/>
        public bool Required
        {
            get
            {
                return this.requiredField;
            }
            set
            {
                this.requiredField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool RequiredSpecified
        {
            get
            {
                return this.requiredFieldSpecified;
            }
            set
            {
                this.requiredFieldSpecified = value;
            }
        }

        /// <remarks/>
        public bool ReadOnly
        {
            get
            {
                return this.readOnlyField;
            }
            set
            {
                this.readOnlyField = value;
            }
        }

        /// <remarks/>
        public string Value
        {
            get
            {
                return this.valueField;
            }
            set
            {
                this.valueField = value;
            }
        }

        /// <remarks/>
        public string Error
        {
            get
            {
                return this.errorField;
            }
            set
            {
                this.errorField = value;
            }
        }

        /// <remarks/>
        public bool Encrypted
        {
            get
            {
                return this.encryptedField;
            }
            set
            {
                this.encryptedField = value;
            }
        }

        /// <remarks/>
        public bool IsPassword
        {
            get
            {
                return this.isPasswordField;
            }
            set
            {
                this.isPasswordField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlArrayItemAttribute("Value")]
        public ValidValue[] ValidValues
        {
            get
            {
                return this.validValuesField;
            }
            set
            {
                this.validValuesField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ValidValue
    {

        private string labelField;

        private string valueField;

        /// <remarks/>
        public string Label
        {
            get
            {
                return this.labelField;
            }
            set
            {
                this.labelField = value;
            }
        }

        /// <remarks/>
        public string Value
        {
            get
            {
                return this.valueField;
            }
            set
            {
                this.valueField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class QueryDefinition
    {

        private string commandTypeField;

        private string commandTextField;

        private int timeoutField;

        private bool timeoutFieldSpecified;

        /// <remarks/>
        public string CommandType
        {
            get
            {
                return this.commandTypeField;
            }
            set
            {
                this.commandTypeField = value;
            }
        }

        /// <remarks/>
        public string CommandText
        {
            get
            {
                return this.commandTextField;
            }
            set
            {
                this.commandTextField = value;
            }
        }

        /// <remarks/>
        public int Timeout
        {
            get
            {
                return this.timeoutField;
            }
            set
            {
                this.timeoutField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool TimeoutSpecified
        {
            get
            {
                return this.timeoutFieldSpecified;
            }
            set
            {
                this.timeoutFieldSpecified = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class Field
    {

        private string aliasField;

        private string nameField;

        /// <remarks/>
        public string Alias
        {
            get
            {
                return this.aliasField;
            }
            set
            {
                this.aliasField = value;
            }
        }

        /// <remarks/>
        public string Name
        {
            get
            {
                return this.nameField;
            }
            set
            {
                this.nameField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class DataSetDefinition
    {

        private Field[] fieldsField;

        private QueryDefinition queryField;

        private SensitivityEnum caseSensitivityField;

        private bool caseSensitivityFieldSpecified;

        private string collationField;

        private SensitivityEnum accentSensitivityField;

        private bool accentSensitivityFieldSpecified;

        private SensitivityEnum kanatypeSensitivityField;

        private bool kanatypeSensitivityFieldSpecified;

        private SensitivityEnum widthSensitivityField;

        private bool widthSensitivityFieldSpecified;

        private string nameField;

        /// <remarks/>
        public Field[] Fields
        {
            get
            {
                return this.fieldsField;
            }
            set
            {
                this.fieldsField = value;
            }
        }

        /// <remarks/>
        public QueryDefinition Query
        {
            get
            {
                return this.queryField;
            }
            set
            {
                this.queryField = value;
            }
        }

        /// <remarks/>
        public SensitivityEnum CaseSensitivity
        {
            get
            {
                return this.caseSensitivityField;
            }
            set
            {
                this.caseSensitivityField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool CaseSensitivitySpecified
        {
            get
            {
                return this.caseSensitivityFieldSpecified;
            }
            set
            {
                this.caseSensitivityFieldSpecified = value;
            }
        }

        /// <remarks/>
        public string Collation
        {
            get
            {
                return this.collationField;
            }
            set
            {
                this.collationField = value;
            }
        }

        /// <remarks/>
        public SensitivityEnum AccentSensitivity
        {
            get
            {
                return this.accentSensitivityField;
            }
            set
            {
                this.accentSensitivityField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool AccentSensitivitySpecified
        {
            get
            {
                return this.accentSensitivityFieldSpecified;
            }
            set
            {
                this.accentSensitivityFieldSpecified = value;
            }
        }

        /// <remarks/>
        public SensitivityEnum KanatypeSensitivity
        {
            get
            {
                return this.kanatypeSensitivityField;
            }
            set
            {
                this.kanatypeSensitivityField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool KanatypeSensitivitySpecified
        {
            get
            {
                return this.kanatypeSensitivityFieldSpecified;
            }
            set
            {
                this.kanatypeSensitivityFieldSpecified = value;
            }
        }

        /// <remarks/>
        public SensitivityEnum WidthSensitivity
        {
            get
            {
                return this.widthSensitivityField;
            }
            set
            {
                this.widthSensitivityField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool WidthSensitivitySpecified
        {
            get
            {
                return this.widthSensitivityFieldSpecified;
            }
            set
            {
                this.widthSensitivityFieldSpecified = value;
            }
        }

        /// <remarks/>
        public string Name
        {
            get
            {
                return this.nameField;
            }
            set
            {
                this.nameField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public enum SensitivityEnum
    {

        /// <remarks/>
        True,

        /// <remarks/>
        False,

        /// <remarks/>
        Auto,
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class DataRetrievalPlan
    {

        private DataSourceDefinitionOrReference itemField;

        private DataSetDefinition dataSetField;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("DataSourceDefinition", typeof(DataSourceDefinition))]
        [System.Xml.Serialization.XmlElementAttribute("DataSourceReference", typeof(DataSourceReference))]
        [System.Xml.Serialization.XmlElementAttribute("InvalidDataSourceReference", typeof(InvalidDataSourceReference))]
        public DataSourceDefinitionOrReference Item
        {
            get
            {
                return this.itemField;
            }
            set
            {
                this.itemField = value;
            }
        }

        /// <remarks/>
        public DataSetDefinition DataSet
        {
            get
            {
                return this.dataSetField;
            }
            set
            {
                this.dataSetField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class DataSourceDefinition : DataSourceDefinitionOrReference
    {

        private string extensionField;

        private string connectStringField;

        private bool useOriginalConnectStringField;

        private bool originalConnectStringExpressionBasedField;

        private CredentialRetrievalEnum credentialRetrievalField;

        private bool windowsCredentialsField;

        private bool impersonateUserField;

        private bool impersonateUserFieldSpecified;

        private string promptField;

        private string userNameField;

        private string passwordField;

        private bool enabledField;

        private bool enabledFieldSpecified;

        /// <remarks/>
        public string Extension
        {
            get
            {
                return this.extensionField;
            }
            set
            {
                this.extensionField = value;
            }
        }

        /// <remarks/>
        public string ConnectString
        {
            get
            {
                return this.connectStringField;
            }
            set
            {
                this.connectStringField = value;
            }
        }

        /// <remarks/>
        public bool UseOriginalConnectString
        {
            get
            {
                return this.useOriginalConnectStringField;
            }
            set
            {
                this.useOriginalConnectStringField = value;
            }
        }

        /// <remarks/>
        public bool OriginalConnectStringExpressionBased
        {
            get
            {
                return this.originalConnectStringExpressionBasedField;
            }
            set
            {
                this.originalConnectStringExpressionBasedField = value;
            }
        }

        /// <remarks/>
        public CredentialRetrievalEnum CredentialRetrieval
        {
            get
            {
                return this.credentialRetrievalField;
            }
            set
            {
                this.credentialRetrievalField = value;
            }
        }

        /// <remarks/>
        public bool WindowsCredentials
        {
            get
            {
                return this.windowsCredentialsField;
            }
            set
            {
                this.windowsCredentialsField = value;
            }
        }

        /// <remarks/>
        public bool ImpersonateUser
        {
            get
            {
                return this.impersonateUserField;
            }
            set
            {
                this.impersonateUserField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool ImpersonateUserSpecified
        {
            get
            {
                return this.impersonateUserFieldSpecified;
            }
            set
            {
                this.impersonateUserFieldSpecified = value;
            }
        }

        /// <remarks/>
        public string Prompt
        {
            get
            {
                return this.promptField;
            }
            set
            {
                this.promptField = value;
            }
        }

        /// <remarks/>
        public string UserName
        {
            get
            {
                return this.userNameField;
            }
            set
            {
                this.userNameField = value;
            }
        }

        /// <remarks/>
        public string Password
        {
            get
            {
                return this.passwordField;
            }
            set
            {
                this.passwordField = value;
            }
        }

        /// <remarks/>
        public bool Enabled
        {
            get
            {
                return this.enabledField;
            }
            set
            {
                this.enabledField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool EnabledSpecified
        {
            get
            {
                return this.enabledFieldSpecified;
            }
            set
            {
                this.enabledFieldSpecified = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public enum CredentialRetrievalEnum
    {

        /// <remarks/>
        Prompt,

        /// <remarks/>
        Store,

        /// <remarks/>
        Integrated,

        /// <remarks/>
        None,
    }

    /// <remarks/>
    [System.Xml.Serialization.XmlIncludeAttribute(typeof(DataSourceReference))]
    [System.Xml.Serialization.XmlIncludeAttribute(typeof(InvalidDataSourceReference))]
    [System.Xml.Serialization.XmlIncludeAttribute(typeof(DataSourceDefinition))]
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class DataSourceDefinitionOrReference
    {
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class DataSourceReference : DataSourceDefinitionOrReference
    {

        private string referenceField;

        /// <remarks/>
        public string Reference
        {
            get
            {
                return this.referenceField;
            }
            set
            {
                this.referenceField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class InvalidDataSourceReference : DataSourceDefinitionOrReference
    {
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class Schedule
    {

        private string scheduleIDField;

        private string nameField;

        private ScheduleDefinition definitionField;

        private string descriptionField;

        private string creatorField;

        private System.DateTime nextRunTimeField;

        private bool nextRunTimeFieldSpecified;

        private System.DateTime lastRunTimeField;

        private bool lastRunTimeFieldSpecified;

        private bool referencesPresentField;

        private ScheduleStateEnum stateField;

        /// <remarks/>
        public string ScheduleID
        {
            get
            {
                return this.scheduleIDField;
            }
            set
            {
                this.scheduleIDField = value;
            }
        }

        /// <remarks/>
        public string Name
        {
            get
            {
                return this.nameField;
            }
            set
            {
                this.nameField = value;
            }
        }

        /// <remarks/>
        public ScheduleDefinition Definition
        {
            get
            {
                return this.definitionField;
            }
            set
            {
                this.definitionField = value;
            }
        }

        /// <remarks/>
        public string Description
        {
            get
            {
                return this.descriptionField;
            }
            set
            {
                this.descriptionField = value;
            }
        }

        /// <remarks/>
        public string Creator
        {
            get
            {
                return this.creatorField;
            }
            set
            {
                this.creatorField = value;
            }
        }

        /// <remarks/>
        public System.DateTime NextRunTime
        {
            get
            {
                return this.nextRunTimeField;
            }
            set
            {
                this.nextRunTimeField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool NextRunTimeSpecified
        {
            get
            {
                return this.nextRunTimeFieldSpecified;
            }
            set
            {
                this.nextRunTimeFieldSpecified = value;
            }
        }

        /// <remarks/>
        public System.DateTime LastRunTime
        {
            get
            {
                return this.lastRunTimeField;
            }
            set
            {
                this.lastRunTimeField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool LastRunTimeSpecified
        {
            get
            {
                return this.lastRunTimeFieldSpecified;
            }
            set
            {
                this.lastRunTimeFieldSpecified = value;
            }
        }

        /// <remarks/>
        public bool ReferencesPresent
        {
            get
            {
                return this.referencesPresentField;
            }
            set
            {
                this.referencesPresentField = value;
            }
        }

        /// <remarks/>
        public ScheduleStateEnum State
        {
            get
            {
                return this.stateField;
            }
            set
            {
                this.stateField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ScheduleDefinition : ScheduleDefinitionOrReference
    {

        private System.DateTime startDateTimeField;

        private System.DateTime endDateField;

        private bool endDateFieldSpecified;

        private RecurrencePattern itemField;

        /// <remarks/>
        public System.DateTime StartDateTime
        {
            get
            {
                return this.startDateTimeField;
            }
            set
            {
                this.startDateTimeField = value;
            }
        }

        /// <remarks/>
        public System.DateTime EndDate
        {
            get
            {
                return this.endDateField;
            }
            set
            {
                this.endDateField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool EndDateSpecified
        {
            get
            {
                return this.endDateFieldSpecified;
            }
            set
            {
                this.endDateFieldSpecified = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("DailyRecurrence", typeof(DailyRecurrence))]
        [System.Xml.Serialization.XmlElementAttribute("MinuteRecurrence", typeof(MinuteRecurrence))]
        [System.Xml.Serialization.XmlElementAttribute("MonthlyDOWRecurrence", typeof(MonthlyDOWRecurrence))]
        [System.Xml.Serialization.XmlElementAttribute("MonthlyRecurrence", typeof(MonthlyRecurrence))]
        [System.Xml.Serialization.XmlElementAttribute("WeeklyRecurrence", typeof(WeeklyRecurrence))]
        public RecurrencePattern Item
        {
            get
            {
                return this.itemField;
            }
            set
            {
                this.itemField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class DailyRecurrence : RecurrencePattern
    {

        private int daysIntervalField;

        /// <remarks/>
        public int DaysInterval
        {
            get
            {
                return this.daysIntervalField;
            }
            set
            {
                this.daysIntervalField = value;
            }
        }
    }

    /// <remarks/>
    [System.Xml.Serialization.XmlIncludeAttribute(typeof(DailyRecurrence))]
    [System.Xml.Serialization.XmlIncludeAttribute(typeof(MinuteRecurrence))]
    [System.Xml.Serialization.XmlIncludeAttribute(typeof(WeeklyRecurrence))]
    [System.Xml.Serialization.XmlIncludeAttribute(typeof(MonthlyRecurrence))]
    [System.Xml.Serialization.XmlIncludeAttribute(typeof(MonthlyDOWRecurrence))]
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class RecurrencePattern
    {
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class MinuteRecurrence : RecurrencePattern
    {

        private int minutesIntervalField;

        /// <remarks/>
        public int MinutesInterval
        {
            get
            {
                return this.minutesIntervalField;
            }
            set
            {
                this.minutesIntervalField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class WeeklyRecurrence : RecurrencePattern
    {

        private int weeksIntervalField;

        private bool weeksIntervalFieldSpecified;

        private DaysOfWeekSelector daysOfWeekField;

        /// <remarks/>
        public int WeeksInterval
        {
            get
            {
                return this.weeksIntervalField;
            }
            set
            {
                this.weeksIntervalField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool WeeksIntervalSpecified
        {
            get
            {
                return this.weeksIntervalFieldSpecified;
            }
            set
            {
                this.weeksIntervalFieldSpecified = value;
            }
        }

        /// <remarks/>
        public DaysOfWeekSelector DaysOfWeek
        {
            get
            {
                return this.daysOfWeekField;
            }
            set
            {
                this.daysOfWeekField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class DaysOfWeekSelector
    {

        private bool sundayField;

        private bool mondayField;

        private bool tuesdayField;

        private bool wednesdayField;

        private bool thursdayField;

        private bool fridayField;

        private bool saturdayField;

        /// <remarks/>
        public bool Sunday
        {
            get
            {
                return this.sundayField;
            }
            set
            {
                this.sundayField = value;
            }
        }

        /// <remarks/>
        public bool Monday
        {
            get
            {
                return this.mondayField;
            }
            set
            {
                this.mondayField = value;
            }
        }

        /// <remarks/>
        public bool Tuesday
        {
            get
            {
                return this.tuesdayField;
            }
            set
            {
                this.tuesdayField = value;
            }
        }

        /// <remarks/>
        public bool Wednesday
        {
            get
            {
                return this.wednesdayField;
            }
            set
            {
                this.wednesdayField = value;
            }
        }

        /// <remarks/>
        public bool Thursday
        {
            get
            {
                return this.thursdayField;
            }
            set
            {
                this.thursdayField = value;
            }
        }

        /// <remarks/>
        public bool Friday
        {
            get
            {
                return this.fridayField;
            }
            set
            {
                this.fridayField = value;
            }
        }

        /// <remarks/>
        public bool Saturday
        {
            get
            {
                return this.saturdayField;
            }
            set
            {
                this.saturdayField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class MonthlyRecurrence : RecurrencePattern
    {

        private string daysField;

        private MonthsOfYearSelector monthsOfYearField;

        /// <remarks/>
        public string Days
        {
            get
            {
                return this.daysField;
            }
            set
            {
                this.daysField = value;
            }
        }

        /// <remarks/>
        public MonthsOfYearSelector MonthsOfYear
        {
            get
            {
                return this.monthsOfYearField;
            }
            set
            {
                this.monthsOfYearField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class MonthsOfYearSelector
    {

        private bool januaryField;

        private bool februaryField;

        private bool marchField;

        private bool aprilField;

        private bool mayField;

        private bool juneField;

        private bool julyField;

        private bool augustField;

        private bool septemberField;

        private bool octoberField;

        private bool novemberField;

        private bool decemberField;

        /// <remarks/>
        public bool January
        {
            get
            {
                return this.januaryField;
            }
            set
            {
                this.januaryField = value;
            }
        }

        /// <remarks/>
        public bool February
        {
            get
            {
                return this.februaryField;
            }
            set
            {
                this.februaryField = value;
            }
        }

        /// <remarks/>
        public bool March
        {
            get
            {
                return this.marchField;
            }
            set
            {
                this.marchField = value;
            }
        }

        /// <remarks/>
        public bool April
        {
            get
            {
                return this.aprilField;
            }
            set
            {
                this.aprilField = value;
            }
        }

        /// <remarks/>
        public bool May
        {
            get
            {
                return this.mayField;
            }
            set
            {
                this.mayField = value;
            }
        }

        /// <remarks/>
        public bool June
        {
            get
            {
                return this.juneField;
            }
            set
            {
                this.juneField = value;
            }
        }

        /// <remarks/>
        public bool July
        {
            get
            {
                return this.julyField;
            }
            set
            {
                this.julyField = value;
            }
        }

        /// <remarks/>
        public bool August
        {
            get
            {
                return this.augustField;
            }
            set
            {
                this.augustField = value;
            }
        }

        /// <remarks/>
        public bool September
        {
            get
            {
                return this.septemberField;
            }
            set
            {
                this.septemberField = value;
            }
        }

        /// <remarks/>
        public bool October
        {
            get
            {
                return this.octoberField;
            }
            set
            {
                this.octoberField = value;
            }
        }

        /// <remarks/>
        public bool November
        {
            get
            {
                return this.novemberField;
            }
            set
            {
                this.novemberField = value;
            }
        }

        /// <remarks/>
        public bool December
        {
            get
            {
                return this.decemberField;
            }
            set
            {
                this.decemberField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class MonthlyDOWRecurrence : RecurrencePattern
    {

        private WeekNumberEnum whichWeekField;

        private bool whichWeekFieldSpecified;

        private DaysOfWeekSelector daysOfWeekField;

        private MonthsOfYearSelector monthsOfYearField;

        /// <remarks/>
        public WeekNumberEnum WhichWeek
        {
            get
            {
                return this.whichWeekField;
            }
            set
            {
                this.whichWeekField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool WhichWeekSpecified
        {
            get
            {
                return this.whichWeekFieldSpecified;
            }
            set
            {
                this.whichWeekFieldSpecified = value;
            }
        }

        /// <remarks/>
        public DaysOfWeekSelector DaysOfWeek
        {
            get
            {
                return this.daysOfWeekField;
            }
            set
            {
                this.daysOfWeekField = value;
            }
        }

        /// <remarks/>
        public MonthsOfYearSelector MonthsOfYear
        {
            get
            {
                return this.monthsOfYearField;
            }
            set
            {
                this.monthsOfYearField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public enum WeekNumberEnum
    {

        /// <remarks/>
        FirstWeek,

        /// <remarks/>
        SecondWeek,

        /// <remarks/>
        ThirdWeek,

        /// <remarks/>
        FourthWeek,

        /// <remarks/>
        LastWeek,
    }

    /// <remarks/>
    [System.Xml.Serialization.XmlIncludeAttribute(typeof(ScheduleDefinition))]
    [System.Xml.Serialization.XmlIncludeAttribute(typeof(ScheduleReference))]
    [System.Xml.Serialization.XmlIncludeAttribute(typeof(NoSchedule))]
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ScheduleDefinitionOrReference
    {
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ScheduleReference : ScheduleDefinitionOrReference
    {

        private string scheduleIDField;

        private ScheduleDefinition definitionField;

        /// <remarks/>
        public string ScheduleID
        {
            get
            {
                return this.scheduleIDField;
            }
            set
            {
                this.scheduleIDField = value;
            }
        }

        /// <remarks/>
        public ScheduleDefinition Definition
        {
            get
            {
                return this.definitionField;
            }
            set
            {
                this.definitionField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class NoSchedule : ScheduleDefinitionOrReference
    {
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public enum ScheduleStateEnum
    {

        /// <remarks/>
        Ready,

        /// <remarks/>
        Running,

        /// <remarks/>
        Paused,

        /// <remarks/>
        Expired,

        /// <remarks/>
        Failing,
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ReportHistorySnapshot
    {

        private string historyIDField;

        private System.DateTime creationDateField;

        private int sizeField;

        /// <remarks/>
        public string HistoryID
        {
            get
            {
                return this.historyIDField;
            }
            set
            {
                this.historyIDField = value;
            }
        }

        /// <remarks/>
        public System.DateTime CreationDate
        {
            get
            {
                return this.creationDateField;
            }
            set
            {
                this.creationDateField = value;
            }
        }

        /// <remarks/>
        public int Size
        {
            get
            {
                return this.sizeField;
            }
            set
            {
                this.sizeField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class DataSourcePrompt
    {

        private string nameField;

        private string dataSourceIDField;

        private string promptField;

        /// <remarks/>
        public string Name
        {
            get
            {
                return this.nameField;
            }
            set
            {
                this.nameField = value;
            }
        }

        /// <remarks/>
        public string DataSourceID
        {
            get
            {
                return this.dataSourceIDField;
            }
            set
            {
                this.dataSourceIDField = value;
            }
        }

        /// <remarks/>
        public string Prompt
        {
            get
            {
                return this.promptField;
            }
            set
            {
                this.promptField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class DataSource
    {

        private string nameField;

        private DataSourceDefinitionOrReference itemField;

        /// <remarks/>
        public string Name
        {
            get
            {
                return this.nameField;
            }
            set
            {
                this.nameField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("DataSourceDefinition", typeof(DataSourceDefinition))]
        [System.Xml.Serialization.XmlElementAttribute("DataSourceReference", typeof(DataSourceReference))]
        [System.Xml.Serialization.XmlElementAttribute("InvalidDataSourceReference", typeof(InvalidDataSourceReference))]
        public DataSourceDefinitionOrReference Item
        {
            get
            {
                return this.itemField;
            }
            set
            {
                this.itemField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class Job
    {

        private string jobIDField;

        private string nameField;

        private string pathField;

        private string descriptionField;

        private string machineField;

        private string userField;

        private System.DateTime startDateTimeField;

        private JobActionEnum actionField;

        private JobTypeEnum typeField;

        private JobStatusEnum statusField;

        /// <remarks/>
        public string JobID
        {
            get
            {
                return this.jobIDField;
            }
            set
            {
                this.jobIDField = value;
            }
        }

        /// <remarks/>
        public string Name
        {
            get
            {
                return this.nameField;
            }
            set
            {
                this.nameField = value;
            }
        }

        /// <remarks/>
        public string Path
        {
            get
            {
                return this.pathField;
            }
            set
            {
                this.pathField = value;
            }
        }

        /// <remarks/>
        public string Description
        {
            get
            {
                return this.descriptionField;
            }
            set
            {
                this.descriptionField = value;
            }
        }

        /// <remarks/>
        public string Machine
        {
            get
            {
                return this.machineField;
            }
            set
            {
                this.machineField = value;
            }
        }

        /// <remarks/>
        public string User
        {
            get
            {
                return this.userField;
            }
            set
            {
                this.userField = value;
            }
        }

        /// <remarks/>
        public System.DateTime StartDateTime
        {
            get
            {
                return this.startDateTimeField;
            }
            set
            {
                this.startDateTimeField = value;
            }
        }

        /// <remarks/>
        public JobActionEnum Action
        {
            get
            {
                return this.actionField;
            }
            set
            {
                this.actionField = value;
            }
        }

        /// <remarks/>
        public JobTypeEnum Type
        {
            get
            {
                return this.typeField;
            }
            set
            {
                this.typeField = value;
            }
        }

        /// <remarks/>
        public JobStatusEnum Status
        {
            get
            {
                return this.statusField;
            }
            set
            {
                this.statusField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public enum JobActionEnum
    {

        /// <remarks/>
        Render,

        /// <remarks/>
        SnapshotCreation,

        /// <remarks/>
        ReportHistoryCreation,

        /// <remarks/>
        ExecuteQuery,

        /// <remarks/>
        GetUserModel,
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public enum JobTypeEnum
    {

        /// <remarks/>
        User,

        /// <remarks/>
        System,
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public enum JobStatusEnum
    {

        /// <remarks/>
        New,

        /// <remarks/>
        Running,

        /// <remarks/>
        CancelRequested,
    }

    /// <remarks/>
    [System.Xml.Serialization.XmlIncludeAttribute(typeof(ScheduleExpiration))]
    [System.Xml.Serialization.XmlIncludeAttribute(typeof(TimeExpiration))]
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ExpirationDefinition
    {
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ScheduleExpiration : ExpirationDefinition
    {

        private ScheduleDefinitionOrReference itemField;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute("ScheduleDefinition", typeof(ScheduleDefinition))]
        [System.Xml.Serialization.XmlElementAttribute("ScheduleReference", typeof(ScheduleReference))]
        public ScheduleDefinitionOrReference Item
        {
            get
            {
                return this.itemField;
            }
            set
            {
                this.itemField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class TimeExpiration : ExpirationDefinition
    {

        private int minutesField;

        /// <remarks/>
        public int Minutes
        {
            get
            {
                return this.minutesField;
            }
            set
            {
                this.minutesField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class ReportParameter
    {

        private string nameField;

        private ParameterTypeEnum typeField;

        private bool typeFieldSpecified;

        private bool nullableField;

        private bool nullableFieldSpecified;

        private bool allowBlankField;

        private bool allowBlankFieldSpecified;

        private bool multiValueField;

        private bool multiValueFieldSpecified;

        private bool queryParameterField;

        private bool queryParameterFieldSpecified;

        private string promptField;

        private bool promptUserField;

        private bool promptUserFieldSpecified;

        private string[] dependenciesField;

        private bool validValuesQueryBasedField;

        private bool validValuesQueryBasedFieldSpecified;

        private ValidValue[] validValuesField;

        private bool defaultValuesQueryBasedField;

        private bool defaultValuesQueryBasedFieldSpecified;

        private string[] defaultValuesField;

        private ParameterStateEnum stateField;

        private bool stateFieldSpecified;

        private string errorMessageField;

        /// <remarks/>
        public string Name
        {
            get
            {
                return this.nameField;
            }
            set
            {
                this.nameField = value;
            }
        }

        /// <remarks/>
        public ParameterTypeEnum Type
        {
            get
            {
                return this.typeField;
            }
            set
            {
                this.typeField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool TypeSpecified
        {
            get
            {
                return this.typeFieldSpecified;
            }
            set
            {
                this.typeFieldSpecified = value;
            }
        }

        /// <remarks/>
        public bool Nullable
        {
            get
            {
                return this.nullableField;
            }
            set
            {
                this.nullableField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool NullableSpecified
        {
            get
            {
                return this.nullableFieldSpecified;
            }
            set
            {
                this.nullableFieldSpecified = value;
            }
        }

        /// <remarks/>
        public bool AllowBlank
        {
            get
            {
                return this.allowBlankField;
            }
            set
            {
                this.allowBlankField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool AllowBlankSpecified
        {
            get
            {
                return this.allowBlankFieldSpecified;
            }
            set
            {
                this.allowBlankFieldSpecified = value;
            }
        }

        /// <remarks/>
        public bool MultiValue
        {
            get
            {
                return this.multiValueField;
            }
            set
            {
                this.multiValueField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool MultiValueSpecified
        {
            get
            {
                return this.multiValueFieldSpecified;
            }
            set
            {
                this.multiValueFieldSpecified = value;
            }
        }

        /// <remarks/>
        public bool QueryParameter
        {
            get
            {
                return this.queryParameterField;
            }
            set
            {
                this.queryParameterField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool QueryParameterSpecified
        {
            get
            {
                return this.queryParameterFieldSpecified;
            }
            set
            {
                this.queryParameterFieldSpecified = value;
            }
        }

        /// <remarks/>
        public string Prompt
        {
            get
            {
                return this.promptField;
            }
            set
            {
                this.promptField = value;
            }
        }

        /// <remarks/>
        public bool PromptUser
        {
            get
            {
                return this.promptUserField;
            }
            set
            {
                this.promptUserField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool PromptUserSpecified
        {
            get
            {
                return this.promptUserFieldSpecified;
            }
            set
            {
                this.promptUserFieldSpecified = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlArrayItemAttribute("Dependency")]
        public string[] Dependencies
        {
            get
            {
                return this.dependenciesField;
            }
            set
            {
                this.dependenciesField = value;
            }
        }

        /// <remarks/>
        public bool ValidValuesQueryBased
        {
            get
            {
                return this.validValuesQueryBasedField;
            }
            set
            {
                this.validValuesQueryBasedField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool ValidValuesQueryBasedSpecified
        {
            get
            {
                return this.validValuesQueryBasedFieldSpecified;
            }
            set
            {
                this.validValuesQueryBasedFieldSpecified = value;
            }
        }

        /// <remarks/>
        public ValidValue[] ValidValues
        {
            get
            {
                return this.validValuesField;
            }
            set
            {
                this.validValuesField = value;
            }
        }

        /// <remarks/>
        public bool DefaultValuesQueryBased
        {
            get
            {
                return this.defaultValuesQueryBasedField;
            }
            set
            {
                this.defaultValuesQueryBasedField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool DefaultValuesQueryBasedSpecified
        {
            get
            {
                return this.defaultValuesQueryBasedFieldSpecified;
            }
            set
            {
                this.defaultValuesQueryBasedFieldSpecified = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlArrayItemAttribute("Value")]
        public string[] DefaultValues
        {
            get
            {
                return this.defaultValuesField;
            }
            set
            {
                this.defaultValuesField = value;
            }
        }

        /// <remarks/>
        public ParameterStateEnum State
        {
            get
            {
                return this.stateField;
            }
            set
            {
                this.stateField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool StateSpecified
        {
            get
            {
                return this.stateFieldSpecified;
            }
            set
            {
                this.stateFieldSpecified = value;
            }
        }

        /// <remarks/>
        public string ErrorMessage
        {
            get
            {
                return this.errorMessageField;
            }
            set
            {
                this.errorMessageField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public enum ParameterTypeEnum
    {

        /// <remarks/>
        Boolean,

        /// <remarks/>
        DateTime,

        /// <remarks/>
        Integer,

        /// <remarks/>
        Float,

        /// <remarks/>
        String,
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public enum ParameterStateEnum
    {

        /// <remarks/>
        HasValidValue,

        /// <remarks/>
        MissingValidValue,

        /// <remarks/>
        HasOutstandingDependencies,

        /// <remarks/>
        DynamicValuesUnavailable,
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class DataSourceCredentials
    {

        private string dataSourceNameField;

        private string userNameField;

        private string passwordField;

        /// <remarks/>
        public string DataSourceName
        {
            get
            {
                return this.dataSourceNameField;
            }
            set
            {
                this.dataSourceNameField = value;
            }
        }

        /// <remarks/>
        public string UserName
        {
            get
            {
                return this.userNameField;
            }
            set
            {
                this.userNameField = value;
            }
        }

        /// <remarks/>
        public string Password
        {
            get
            {
                return this.passwordField;
            }
            set
            {
                this.passwordField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    //[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class Warning
    {

        private string codeField;

        private string severityField;

        private string objectNameField;

        private string objectTypeField;

        private string messageField;

        /// <remarks/>
        public string Code
        {
            get
            {
                return this.codeField;
            }
            set
            {
                this.codeField = value;
            }
        }

        /// <remarks/>
        public string Severity
        {
            get
            {
                return this.severityField;
            }
            set
            {
                this.severityField = value;
            }
        }

        /// <remarks/>
        public string ObjectName
        {
            get
            {
                return this.objectNameField;
            }
            set
            {
                this.objectNameField = value;
            }
        }

        /// <remarks/>
        public string ObjectType
        {
            get
            {
                return this.objectTypeField;
            }
            set
            {
                this.objectTypeField = value;
            }
        }

        /// <remarks/>
        public string Message
        {
            get
            {
                return this.messageField;
            }
            set
            {
                this.messageField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    ////[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices" + " http://schemas.microsoft.com/sqlserver/2005/06/30/reporting/reportingservices")]
    ////[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2005/06/30/reporting/reportingservices")]
    [DataContract]
    public partial class CatalogItem
    {

        private string idField;

        private string nameField;

        private string pathField;

        private string virtualPathField;

        private ItemTypeEnum typeField;

        private int sizeField;

        private bool sizeFieldSpecified;

        private string descriptionField;

        private bool hiddenField;

        private bool hiddenFieldSpecified;

        private System.DateTime creationDateField;

        private bool creationDateFieldSpecified;

        private System.DateTime modifiedDateField;

        private bool modifiedDateFieldSpecified;

        private string createdByField;

        private string modifiedByField;

        private string mimeTypeField;

        private System.DateTime executionDateField;

        private bool executionDateFieldSpecified;

        /// <remarks/>
        [DataMember]
        public string ID
        {
            get
            {
                return this.idField;
            }
            set
            {
                this.idField = value;
            }
        }

        /// <remarks/>
        [DataMember]
        public string Name
        {
            get
            {
                return this.nameField;
            }
            set
            {
                this.nameField = value;
            }
        }

        /// <remarks/>
        [DataMember]
        public string Path
        {
            get
            {
                return this.pathField;
            }
            set
            {
                this.pathField = value;
            }
        }

        /// <remarks/>
        public string VirtualPath
        {
            get
            {
                return this.virtualPathField;
            }
            set
            {
                this.virtualPathField = value;
            }
        }

        /// <remarks/>
        [DataMember]
        public ItemTypeEnum Type
        {
            get
            {
                return this.typeField;
            }
            set
            {
                this.typeField = value;
            }
        }

        /// <remarks/>
        public int Size
        {
            get
            {
                return this.sizeField;
            }
            set
            {
                this.sizeField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool SizeSpecified
        {
            get
            {
                return this.sizeFieldSpecified;
            }
            set
            {
                this.sizeFieldSpecified = value;
            }
        }

        /// <remarks/>
        public string Description
        {
            get
            {
                return this.descriptionField;
            }
            set
            {
                this.descriptionField = value;
            }
        }

        /// <remarks/>
        public bool Hidden
        {
            get
            {
                return this.hiddenField;
            }
            set
            {
                this.hiddenField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool HiddenSpecified
        {
            get
            {
                return this.hiddenFieldSpecified;
            }
            set
            {
                this.hiddenFieldSpecified = value;
            }
        }

        /// <remarks/>
        public System.DateTime CreationDate
        {
            get
            {
                return this.creationDateField;
            }
            set
            {
                this.creationDateField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool CreationDateSpecified
        {
            get
            {
                return this.creationDateFieldSpecified;
            }
            set
            {
                this.creationDateFieldSpecified = value;
            }
        }

        /// <remarks/>
        public System.DateTime ModifiedDate
        {
            get
            {
                return this.modifiedDateField;
            }
            set
            {
                this.modifiedDateField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool ModifiedDateSpecified
        {
            get
            {
                return this.modifiedDateFieldSpecified;
            }
            set
            {
                this.modifiedDateFieldSpecified = value;
            }
        }

        /// <remarks/>
        public string CreatedBy
        {
            get
            {
                return this.createdByField;
            }
            set
            {
                this.createdByField = value;
            }
        }

        /// <remarks/>
        public string ModifiedBy
        {
            get
            {
                return this.modifiedByField;
            }
            set
            {
                this.modifiedByField = value;
            }
        }

        /// <remarks/>
        public string MimeType
        {
            get
            {
                return this.mimeTypeField;
            }
            set
            {
                this.mimeTypeField = value;
            }
        }

        /// <remarks/>
        public System.DateTime ExecutionDate
        {
            get
            {
                return this.executionDateField;
            }
            set
            {
                this.executionDateField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool ExecutionDateSpecified
        {
            get
            {
                return this.executionDateFieldSpecified;
            }
            set
            {
                this.executionDateFieldSpecified = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    ////[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    ////[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2005/06/30/reporting/reportingservices")]
    public enum ItemTypeEnum
    {

        /// <remarks/>
        Unknown = 0,

        /// <remarks/>
        Folder =1,

        /// <remarks/>
        Report =2,

        /// <remarks/>
        Resource =3,

        /// <remarks/>
        LinkedReport =4,

        /// <remarks/>
        DataSource=5,

        /// <remarks/>
        Model=6,

        /// <remarks/>
        Site=7,
        
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    ////[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public partial class Property
    {

        private string nameField;

        private string valueField;

        /// <remarks/>
        public string Name
        {
            get
            {
                return this.nameField;
            }
            set
            {
                this.nameField = value;
            }
        }

        /// <remarks/>
        public string Value
        {
            get
            {
                return this.valueField;
            }
            set
            {
                this.valueField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    ////[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
   //[System.Xml.Serialization.XmlRootAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices", IsNullable = false)]
    public partial class TrustedUserHeader : System.Web.Services.Protocols.SoapHeader
    {

        private string userNameField;

        private byte[] userTokenField;

        private System.Xml.XmlAttribute[] anyAttrField;

        /// <remarks/>
        public string UserName
        {
            get
            {
                return this.userNameField;
            }
            set
            {
                this.userNameField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(DataType = "base64Binary")]
        public byte[] UserToken
        {
            get
            {
                return this.userTokenField;
            }
            set
            {
                this.userTokenField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlAnyAttributeAttribute()]
        public System.Xml.XmlAttribute[] AnyAttr
        {
            get
            {
                return this.anyAttrField;
            }
            set
            {
                this.anyAttrField = value;
            }
        }
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    ////[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public enum ExecutionSettingEnum
    {

        /// <remarks/>
        Live,

        /// <remarks/>
        Snapshot,
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("wsdl", "4.0.30319.17929")]
    [System.SerializableAttribute()]
    ////[System.Xml.Serialization.XmlTypeAttribute(Namespace = "http://schemas.microsoft.com/sqlserver/2006/03/15/reporting/reportingservices")]
    public enum SecurityScopeEnum
    {

        /// <remarks/>
        System,

        /// <remarks/>
        Catalog,

        /// <remarks/>
        Model,

        /// <remarks/>
        All,
    }

}
