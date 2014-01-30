using System;
using System.Configuration;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Text;
using Jayrock.Json;
using ForerunnerLicense;
using Forerunner.Logging;

namespace Forerunner.SSRS.JSONRender
{

    internal class ReportJSONWriter : IDisposable
    {       
        JsonWriter w = new JsonTextWriter();
        JsonWriter s = new JsonTextWriter();
        JsonWriter tmpWriter = new JsonTextWriter();
        string LastID = null;

        byte majorVersion;
        byte minorVersion;
        Dictionary<string, TempProperty> TempPropertyBag = new Dictionary<string, TempProperty>();
        RPLReader RPL;
        Dictionary<string, string> SharedStyles = new Dictionary<string, string>();

        struct TempProperty
        {
            public string Name;
            public string Type;
            public object Value;
        }

        class RPLProperties
        {
            public RPLProperty[] PropArray;
            public byte RPLPropBagCode;
            public int NumProp;
            byte TypeCode = 0x00;

            public class RPLProperty
            {
                public string Name;
                public string DataType;
                public byte RPLCode;
                public Func<Boolean> ObjFunction;
                public Func<Byte, Boolean> ObjFunction2;
                public Boolean MakeTemp = false;
            }


            public RPLProperties(byte RPLCode)
            {
                RPLPropBagCode = RPLCode;
                PropArray = new RPLProperty[50];  //Hard coded this should be changed to a collection
                NumProp = 0;
            }


            public void Add(string Name, string Type, byte Code, Func<Byte, Boolean> f, Boolean MakeTemp = false)
            {

                //This is a Total Hack for OrigionalValue

                if (NumProp == PropArray.GetUpperBound(0))
                    //Need to Grow, throw for now
                    ThrowParseError();

                PropArray[NumProp] = new RPLProperty();
                PropArray[NumProp].Name = Name;
                PropArray[NumProp].DataType = Type;
                PropArray[NumProp].RPLCode = Code;
                PropArray[NumProp].ObjFunction2 = f;
                PropArray[NumProp].MakeTemp = MakeTemp;
                NumProp++;
            }

            public void Add(string Name, string Type, byte Code, Func<Boolean> f = null, Boolean MakeTemp = false)
            {
                if (NumProp == PropArray.GetUpperBound(0))
                    //Need to Grow, throw for now
                    ThrowParseError();

                PropArray[NumProp] = new RPLProperty();
                PropArray[NumProp].Name = Name;
                PropArray[NumProp].DataType = Type;
                PropArray[NumProp].RPLCode = Code;
                PropArray[NumProp].ObjFunction = f;
                PropArray[NumProp].MakeTemp = MakeTemp;
                NumProp++;
            }

            public void Add(string Name, string Type, byte Code, Boolean MakeTemp)
            {
                if (NumProp == PropArray.GetUpperBound(0))
                    //Need to Grow, throw for now
                    ThrowParseError();

                PropArray[NumProp] = new RPLProperty();
                PropArray[NumProp].Name = Name;
                PropArray[NumProp].DataType = Type;
                PropArray[NumProp].RPLCode = Code;
                PropArray[NumProp].MakeTemp = MakeTemp;
                NumProp++;
            }

            internal void WriteMemeber(byte Code, ReportJSONWriter r,JsonWriter w)
            {
                int i;

                for (i = 0; i < NumProp; i++)
                {
                    if (PropArray[i].RPLCode == Code)
                        break;
                }

                if (i < NumProp)
                {
                    TempProperty tmp = new TempProperty();
                    if (PropArray[i].MakeTemp)
                    {
                        tmp.Name = PropArray[i].Name;
                        tmp.Type = PropArray[i].DataType;
                        r.TempPropertyBag.Add(tmp.Name, tmp);
                    }
                    else
                    {
                        w.WriteMember(PropArray[i].Name);
                    }
                    switch (PropArray[i].DataType)
                    {
                        case "Int32":
                            if (PropArray[i].MakeTemp) tmp.Value = r.RPL.ReadInt32(); else w.WriteNumber(r.RPL.ReadInt32());
                            break;
                        case "Int64":
                            if (PropArray[i].MakeTemp) tmp.Value = r.RPL.ReadInt64(); else w.WriteNumber(r.RPL.ReadInt64());
                            break;
                        case "Int16":
                            if (PropArray[i].MakeTemp) tmp.Value = r.RPL.ReadInt16(); else w.WriteNumber(r.RPL.ReadInt16());
                            break;
                        case "String":
                            //Total hack for shareed Style ID.  Much faster than searching later
                            string value =  r.RPL.ReadString();
                            if (PropArray[i].Name == "SID")
                                r.LastID = value;
                            if (PropArray[i].MakeTemp) tmp.Value =value; else w.WriteString(value);
                            break;
                        case "Float":
                            if (PropArray[i].MakeTemp) tmp.Value = r.RPL.ReadFloat(); else w.WriteNumber(r.RPL.ReadFloat());
                            break;
                        case "Single":
                            if (PropArray[i].MakeTemp) tmp.Value = r.RPL.ReadSingle(); else w.WriteNumber(r.RPL.ReadSingle());
                            break;
                        case "Char":
                            if (PropArray[i].MakeTemp) tmp.Value = r.RPL.ReadChar().ToString(); else w.WriteString(r.RPL.ReadChar().ToString());
                            break;
                        case "DateTime":
                            if (PropArray[i].MakeTemp) tmp.Value = r.RPL.ReadDateTime().MiliSec; else w.WriteNumber(r.RPL.ReadDateTime().MiliSec);
                            //TODO Need to write datetime type
                            break;
                        case "Decimal":
                            if (PropArray[i].MakeTemp) tmp.Value = r.RPL.ReadDecimal(); else w.WriteNumber(r.RPL.ReadDecimal());
                            break;
                        case "Boolean":
                            if (PropArray[i].MakeTemp) tmp.Value = r.RPL.ReadBoolean(); else w.WriteBoolean(r.RPL.ReadBoolean());
                            break;
                        case "Byte":
                            //This is a Total Hack for OrigionalValue
                            //TypeCode is guarenteed to come  before OrigionalValue
                            if (PropArray[i].Name == "TypeCode")
                            {
                                TypeCode = r.RPL.ReadByte();
                                w.WriteNumber(TypeCode);
                            }
                            else
                                if (PropArray[i].MakeTemp) tmp.Value = r.RPL.ReadByte(); else w.WriteNumber(r.RPL.ReadByte());
                            break;
                        case "Object":

                            //TODO: Handle MakeTemp
                            //if (PropArray[i].MakeTemp) tmp.Value = r.ReadFloat(); else w.WriteNumber(r.ReadFloat());                            

                            //This is a Total Hack for OrigionalValue
                            if (PropArray[i].Name == "OriginalValue")
                                PropArray[i].ObjFunction2(TypeCode);
                            else
                            {
                                w.WriteStartObject();
                                //Step back a byte to re-read object type
                                r.RPL.position--;
                                PropArray[i].ObjFunction();
                                w.WriteEndObject();
                            }
                            break;
                        default:
                            ThrowParseError();
                            break;
                    }

                }
                else
                    ThrowParseError();

            }

            public void ThrowParseError()
            {
                throw new Exception();
            }

            public void Write(ReportJSONWriter r,  Byte EndCode = 0xFF)
            {
                Write(r, r.w, EndCode);
            }
            public void Write(ReportJSONWriter r, JsonWriter w, Byte EndCode = 0xFF)
            {

                //If RPLPRopertyBagCode is 0xFF then there is no Object code just arbitrary properties
                if (RPLPropBagCode == 0xFF)
                {
                    byte isEnd = r.RPL.ReadByte();
                    while (isEnd != EndCode && isEnd !=0xFF)
                    {
                        WriteMemeber(isEnd, r,w);
                        isEnd = r.RPL.ReadByte();
                    }
                }
                else if (r.RPL.ReadByte() == RPLPropBagCode)
                {
                    byte isEnd = r.RPL.ReadByte();
                    while (isEnd != EndCode)
                    {
                        WriteMemeber(isEnd, r,w);
                        isEnd = r.RPL.ReadByte();
                    }
                }
                else
                    ThrowParseError();
            }

        }

        public ReportJSONWriter(Stream RPL)
        {
            this.RPL = new RPLReader(RPL);
        }

        public StringWriter RPLToJSON(int NumPages)
        {

//#if !DEBUG           
            try
            {
                ClientLicense.Validate();
            }
            catch (TypeInitializationException e)
            {
                Logger.Trace(LogType.Error, "ClientLicense Type initialization failed.  Please restart RS service.");
                LicenseException.Throw(LicenseException.FailReason.InitializationFailure, "License Initialization failed");                
            }
//#endif
            
            LicenseData License = ClientLicense.GetLicense();

            RPL.position = 0;

            //CreateStyle object           
            s.WriteStartObject();


            w.WriteStartObject();
            
            w.WriteMember("SKU");
            w.WriteString(License.SKU);
            w.WriteMember("Trial");
            w.WriteNumber(License.IsTrial);

            w.WriteMember("RPLStamp");
            w.WriteString(RPL.ReadString());
            w.WriteMember("NumPages");
            w.WriteNumber(NumPages);

            //Version
            WriteJSONVersion();

            //Report Start
            if (RPL.ReadByte() == 0x00)
            {
                w.WriteMember("Report");
                w.WriteStartObject();

                //Report Porperties            
                WriteJSONRepProp();

                //Report Content
                WriteJSONReportContent();

                //Do not need these, but read to end of stream
                w.SetShouldWrite(false);
                //OffSet
                WriteJSONArrayOffset();
                WriteJSONReportElementEnd();
                //Version
                WriteJSONVersion();
                w.SetShouldWrite(true);               

                //End Report
                w.WriteEndObject();
            }

            
            //close Style object
            //s.WriteEndArray();
            s.WriteEndObject();

            
            w.WriteMember("SharedElements");
            //JsonReader r = new JsonBufferReader(JsonBuffer.From(s.ToString()));
            //w.WriteFromReader(r);
            
            StringWriter sw = (w as JsonTextWriter).InnerWriter as StringWriter;
            
            //Write shared Styles
            StringWriter styles = new StringWriter();
            styles.Write("{");
            int count = 0;
            foreach (KeyValuePair<string, string> entry in SharedStyles)
            {                
                styles.Write( "\"" + entry.Key + "\":" + entry.Value);
                if (++count < SharedStyles.Count)
                    styles.Write(",");
            }

            //Add styles to reports and and object
            sw.Write(styles);
            sw.Write("}}");
            return sw;
            

        }

        private Boolean DeReference(long StartIndex, Func<Boolean> DeFunction)
        {

            long CurrIndex = RPL.position;
            RPL.position = StartIndex;
            DeFunction();
            RPL.position = CurrIndex;
            return true;
        }

        private void ThrowParseError()
        {
            Forerunner.Logging.ExceptionLogGenerator.LogExceptionWithRPL(string.Empty, RPL.RPLStream);
        }
        private void ThrowParseError(string Msg)
        {
            Forerunner.Logging.ExceptionLogGenerator.LogExceptionWithRPL(Msg, RPL.RPLStream);
        }
        private void ThrowParseError(string Msg, Exception e)
        {
            Forerunner.Logging.ExceptionLogGenerator.LogExceptionWithRPL(Msg, RPL.RPLStream, e);
        }

        private Boolean LoopObjectArray(string ArrayName, byte Code, Func<Boolean> f)
        {
            w.WriteMember(ArrayName);
            w.WriteStartArray();
            while (RPL.ReadByte() == Code)
                f();
            w.WriteEndArray();

            //Reset Object since this is the end of the array
            RPL.position--;
            return true;
        }

        private Boolean checkVersion(byte major, byte minor)
        {
            if (major == this.majorVersion && minor == this.minorVersion)
                return true;
            else
                return false;
        }

        private void WriteTempProperty(string PropName)
        {
            if (!TempPropertyBag.ContainsKey(PropName))
                return;

            TempProperty tmp = TempPropertyBag[PropName];
            w.WriteMember(PropName);
            switch (tmp.Type)
            {
                case "String":
                case "Char":
                    w.WriteString((String)tmp.Value);
                    break;
                case "Int16":
                    w.WriteNumber((Int16)tmp.Value);
                    break;
                case "Int32":
                    w.WriteNumber((Int32)tmp.Value);
                    break;
                case "Int64":
                    w.WriteNumber((Int64)tmp.Value);
                    break;
                case "Single":
                    w.WriteNumber((Single)tmp.Value);
                    break;
                case "Float":
                    w.WriteNumber((float)tmp.Value);
                    break;
                case "Decimal":
                    w.WriteNumber((Decimal)tmp.Value);
                    break;
                case "Boolean":
                    w.WriteBoolean((Boolean)tmp.Value);
                    break;
                case "Byte":
                    w.WriteNumber((byte)tmp.Value);
                    break;
                case "DateTime":
                    w.WriteNumber((Int64)((RPLDateTime)tmp.Value).MiliSec);
                    //TODO Need to write datetime type
                    break;
                default:
                    ThrowParseError("WriteTempProperty: Type not found");
                    break;

            }


        }
        private void WriteJSONReportContent()
        {

            if (RPL.ReadByte() == 0x13)
            {

                if (checkVersion(10, 6) || checkVersion(10, 4) || checkVersion(10, 5))
                {
                    w.WriteMember("PageContent");
                    w.WriteStartObject();

                    //PageLayout Start
                    w.WriteMember("PageLayoutStart");
                    w.WriteStartObject();
                    WriteJSONPageProp();
                    if (RPL.ReadByte() != 0xFF)
                        ThrowParseError("WriteJSONReportContent: End Tag not Found");
                    w.WriteEndObject();

                    //Sections
                    LoopObjectArray("Sections", 0x15, this.WriteJSONSections);

                    //Measurments
                    WriteJSONMeasurements();

                    //PageLayout End
                    if (RPL.InspectByte() == 0x03)
                    {
                        w.WriteMember("PageLayoutEnd");
                        w.WriteStartObject();
                        WriteJSONPageProp();
                        w.WriteEndObject();
                    }
                    //Report ElementEnd
                    WriteJSONReportElementEnd();
                    w.WriteEndObject();
                }
                else if (checkVersion(10, 3))
                {
                    w.WriteMember("PageContent");
                    w.WriteStartObject();

                    //Sections
                    //Add fake section
                    w.WriteMember("Sections");
                    w.WriteStartArray();

                    //Only one section
                    w.WriteStartObject();

                    //Write Columns
                    //BodyArea
                    w.WriteMember("Columns");
                    w.WriteStartArray();
                    if (RPL.InspectByte() == 0x14)
                    {
                        //Advance over the the 0x14
                        RPL.position++;
                        while (RPL.InspectByte() == 0x06)
                        {
                            WriteJSONBodyElement();
                        }
                    }

                    w.WriteEndArray();

                    // End Section
                    w.WriteEndObject();
                    w.WriteEndArray();

                    //Measurments
                    WriteJSONMeasurements();

                    //Report ElementEnd
                    WriteJSONReportElementEnd();

                    //PageLayout Start
                    if (RPL.InspectByte() == 0x01)
                    {
                        RPL.position++;
                        w.WriteMember("PageLayoutStart");
                        w.WriteStartObject();
                        WriteJSONPageProp();
                        w.WriteEndObject();
                        
                        //Write properties from page that belong on section                        
                        WriteTempProperty("ColumnSpacing");
                        WriteTempProperty("ColumnCount");

                        //if for some reason there is another onw skip it too - this is probably some other error
                        if (RPL.InspectByte() == 0xFF)
                            RPL.position++;   
                    }

                        WriteJSONHeaderFoooter();
                        //Skip the end 0xFF
                        if (RPL.InspectByte() == 0xFF)
                            RPL.position++;

                    
                    
                    //Measurments
                    WriteJSONMeasurements();

                    //Report ElementEnd
                    WriteJSONReportElementEnd();
                    w.WriteEndObject();
                }

            }
        }
        private void WriteJSONVersion()
        {
            //Version
            w.WriteMember("Version");
            w.WriteStartObject();
            w.WriteMember("Major");
            majorVersion = RPL.ReadByte();
            w.WriteNumber(majorVersion);
            w.WriteMember("Minor");
            minorVersion = RPL.ReadByte();
            w.WriteNumber(minorVersion);
            w.WriteMember("Build");
            w.WriteNumber(RPL.ReadInt32());
            w.WriteEndObject();

        }
        private void WriteJSONArrayOffset()
        {
            int PageCount;

            if (RPL.ReadByte() == 0x12)
            {

                w.WriteMember("ArrayOffset");
                w.WriteStartObject();

                w.WriteMember("Offset");
                w.WriteNumber(RPL.ReadInt64());
                w.WriteMember("Count");
                PageCount = RPL.ReadInt32();
                w.WriteNumber(PageCount);
                w.WriteMember("PageContent");
                w.WriteStartArray();
                for (int i = 0; i < PageCount; i++)
                {
                    w.WriteNumber(RPL.ReadInt64());
                }
                w.WriteEndArray();
                w.WriteEndObject();
            }
            else
                ThrowParseError("WriteJSONArrayOffset: Array Offset Start Tag not found");
        }
        private void WriteJSONPageProp()
        {
            RPLProperties prop = new RPLProperties(0x03);

            prop.Add("ID", "String", 0x01);
            prop.Add("UniqueName", "String", 0x00);
            prop.Add("PageHeight", "Single", 0x10);
            prop.Add("PageWidth", "Single", 0x11);
            prop.Add("MarginTop", "Single", 0x12);
            prop.Add("MarginLeft", "Single", 0x13);
            prop.Add("MarginBottom", "Single", 0x14);
            prop.Add("MarginRight", "Single", 0x15);
            prop.Add("PageName", "String", 0x30);
            prop.Add("Columns", "Int32", 0x17, true);
            prop.Add("ColumnSpacing", "Single", 0x16, true);
            prop.Add("PageStyle", "Object", 0x06, this.WriteJSONNonSharedStyle);

            prop.Write(this);


        }
        private Boolean WriteJSONSections()
        {
            RPLProperties prop;

            w.WriteStartObject();

            //Section Properties
            if (RPL.InspectByte() == 0x16)
            {
                //Mixed Section
                prop = new RPLProperties(0x16);
                prop.Add("ID", "String", 0x00);
                prop.Add("ColumnCount", "Int32", 0x01);
                prop.Add("ColumnSpacing", "Single", 0x02);
                prop.Write(this);
            }
            else if (RPL.InspectByte() == 0x15)
            {
                //SimpleSection Section
                prop = new RPLProperties(0x15);
                prop.Add("ID", "String", 0x00);
                prop.Add("ColumnCount", "Int32", 0x01);
                prop.Add("ColumnSpacing", "Single", 0x02);
                prop.Write(this);
            }
            else
                ThrowParseError("WriteJSONSections: Section not found");

            //BodyArea
            w.WriteMember("Columns");
            w.WriteStartArray();
            if (RPL.InspectByte() == 0x14)
            {
                //Advance over the the 0x14
                RPL.position++;
                while (RPL.InspectByte() == 0x06)
                {
                    WriteJSONBodyElement();
                }

            }

            w.WriteEndArray();
            WriteJSONMeasurements();
            WriteJSONReportElementEnd();
            WriteJSONHeaderFoooter();
           
            //Skip the end 0xFF
            if (RPL.InspectByte() == 0xFF)
                RPL.position++;
            //Measurments
            WriteJSONMeasurements();
            WriteJSONReportElementEnd();
            //Skip the end 0xFF
            if (RPL.InspectByte() == 0xFF)
                RPL.position++;
            w.WriteEndObject();

            return true;

        }
        private void WriteJSONHeaderFoooter()
        {
            //Page Footer
            while (RPL.InspectByte() == 0x05 || RPL.InspectByte() == 0x04)
            {
                if (RPL.InspectByte() == 0x05)
                {
                    RPL.position++;
                    w.WriteMember("PageFooter");
                    w.WriteStartObject();

                    w.WriteMember("Elements");
                    WriteJSONElements();

                    //Report Items
                    w.WriteMember("ReportItems");
                    WriteJSONReportItems();

                    //Measurments
                    WriteJSONMeasurements();
                    WriteJSONReportElementEnd();
                    w.WriteEndObject();
                    //Skip the end 0xFF
                    if (RPL.InspectByte() == 0xFF)
                        RPL.position++;
                }

                //Page Header
                if (RPL.InspectByte() == 0x04)
                {
                    //Skip the 0x04
                    RPL.position++;
                    w.WriteMember("PageHeader");
                    w.WriteStartObject();

                    w.WriteMember("Elements");
                    WriteJSONElements();

                    //Report Items
                    w.WriteMember("ReportItems");
                    WriteJSONReportItems();

                    //Measurments
                    WriteJSONMeasurements();
                    WriteJSONReportElementEnd();
                    w.WriteEndObject();

                    //Skip the end 0xFF
                    if (RPL.InspectByte() == 0xFF)
                        RPL.position++;
                }
            }
        }
        private Boolean WriteJSONBodyElement()
        {
            if (RPL.InspectByte() == 0x06)
            {
                //Advance over the the 0x06
                RPL.position++;

                w.WriteStartObject();
                w.WriteMember("Elements");
                WriteJSONElements();

                //Report Items
                w.WriteMember("ReportItems");
                WriteJSONReportItems();

                //Measurments
                WriteJSONMeasurements();
                WriteJSONReportElementEnd();

                w.WriteEndObject();
            }
            else
                ThrowParseError("WriteJSONBodyElement: Start Tag not found");

            return true;
        }

        private void SaveSharedStyle()
        {

           string ID = LastID;

            if (!SharedStyles.ContainsKey(ID))
                SharedStyles.Add(ID, tmpWriter.ToString());
            
            //Add ID reference to report
            w.WriteMember("SharedElements");
            w.WriteStartObject();
            w.WriteMember("SID");
            w.WriteString(ID);
            w.WriteEndObject();
            
            //reset temp writer
            tmpWriter.Close();
            tmpWriter = new JsonTextWriter();
            
        }
        private Boolean WriteJSONElements(byte ObjectType = 0x00, int DeRef = 0)
        {
            // ObjectType is used to handle dublicate values
            // 0x13 is Paragraph
            //0x14 TextRun

            //Def ref is used for share propoerties that need to be deferenced
            // 0 means normal
            // 1 means Shared property only
            // 2 means non sharred only


            RPLProperties prop;

            if (DeRef != 2)
                if (RPL.ReadByte() != 0x0F)
                    ThrowParseError("Not an Element");


            if (RPL.InspectByte() == 0x00 || (RPL.InspectByte() == 0x01 && DeRef == 2))
            {
                if (DeRef == 1 || DeRef == 0)
                {        
                    //Writeout shared style
                    tmpWriter.WriteStartObject();
                    w.WriteStartObject();
                    prop = new RPLProperties(0x00);
                    prop.Add("SID", "String", 0x01);
                    if (ObjectType != 0x14) prop.Add("Label", "String", 0x03);
                    else prop.Add("Label", "String", 0x08);
                    prop.Add("Name", "String", 0x02);
                    prop.Add("Bookmark", "String", 0x04);
                    prop.Add("Tooltip", "String", 0x05);
                    prop.Add("Style", "Object", 0x06, this.WriteJSONSharedStyle);
                    if (ObjectType != 0x13) prop.Add("ToggleItem", "String", 0x08);
                    prop.Add("Slant", "Byte", 0x18);
                    prop.Add("CanGrow", "Boolean", 0x19);
                    prop.Add("CanShrink", "Boolean", 0x1A);
                    prop.Add("CanSort", "Boolean", 0x1D);
                    if (ObjectType != 0x14) prop.Add("Value", "String", 0x1B);
                    else if (ObjectType != 0x13) prop.Add("Value", "String", 0x0A);
                    else prop.Add("Value", "String", 0x0A);
                    prop.Add("Formula", "String", 0x1F);
                    if (ObjectType != 0x13) prop.Add("Formula", "String", 0x0C);
                    prop.Add("IsToggleParent", "Boolean", 0x20);
                    prop.Add("TypeCode", "Byte", 0x21);
                    prop.Add("OriginalValue", "String", 0x22, this.WriteJSONOrigionalValue);
                    prop.Add("IsSimple", "Boolean", 0x23);
                    prop.Add("Sizing", "Byte", 0x29);
                    prop.Add("LinkToChild", "String", 0x2B);
                    prop.Add("PrintOnFirstPage", "Boolean", 0x2C);
                    prop.Add("PrintBetweenSections", "Boolean", 0x2F);
                    prop.Add("FormattedValueExpressionBased", "Boolean", 0x2D);
                    prop.Add("ReportName", "String", 0x0F);
                    prop.Add("Markup/ListStyle", "Byte", 0x07);
                    prop.Add("ListLevel", "Int32", 0x08);
                    prop.Add("LeftIndent", "String", 0x09);
                    prop.Add("RightIndent", "String", 0x0A);
                    prop.Add("HangingIndent", "String", 0x0B);
                    prop.Add("SpaceBefore", "String", 0x0C);
                    prop.Add("SpaceAfter", "String", 0x0D);
                    prop.Write(this,tmpWriter);
                    tmpWriter.WriteEndObject();
                    SaveSharedStyle();
                }

                if (DeRef == 2 || DeRef == 0)
                {                    
                    //NonShared Properties
                    w.WriteMember("NonSharedElements");
                    w.WriteStartObject();
                    prop = new RPLProperties(0x01);
                    prop.Add("Label", "String", 0x03);
                    if (ObjectType == 0x13) prop.Add("UniqueName", "String", 0x04);
                    else prop.Add("UniqueName", "String", 0x00);
                    prop.Add("Bookmark", "String", 0x04);
                    prop.Add("Tooltip", "String", 0x05);
                    prop.Add("Style", "Object", 0x06, this.WriteJSONNonSharedStyle);
                    if (ObjectType != 0x14) prop.Add("ActionInfo", "Object", 0x07, this.WriteJSONActionInfo);
                    else prop.Add("ActionInfo", "Object", 0x0B, this.WriteJSONActionInfo);
                    if (ObjectType != 0x14) prop.Add("Value", "String", 0x1B);
                    else prop.Add("Value", "String", 0x0A);
                    prop.Add("ToggleState", "Boolean", 0x1C);
                    prop.Add("SortState", "Byte", 0x1E);
                    prop.Add("IsToggleParent", "Boolean", 0x20);
                    prop.Add("TypeCode", "Byte", 0x21);
                    prop.Add("OriginalValue", "String", 0x22, this.WriteJSONOrigionalValue);
                    if (ObjectType != 0x14) prop.Add("ProcessedWithError", "Boolean", 0x2E);
                    else prop.Add("ProcessedWithError", "Boolean", 0x0D);
                    prop.Add("ContentOffset", "Single", 0x25);
                    prop.Add("ContentHeight", "Single", 0x03);
                    prop.Add("ContentHeight", "Single", 0x24);
                    prop.Add("ActionImageMapAreas", "Object", 0x26, this.WriteJSONActionImageMapAreas);
                    prop.Add("DynamicImageData", "Object", 0x27, this.WriteJSONImageData);
                    prop.Add("StreamName", "String", 0x28);
                    prop.Add("ImageDataProperties", "Object", 0x2A, this.WriteJSONImageDataProperties);
                    prop.Add("Language", "String", 0x0B);
                    //prop.Add("Markup/ListStyle", "Boolean", 0x2C);
                    prop.Add("Markup/ListStyle", "Boolean", 0x07);
                    prop.Add("ListLevel", "Int32", 0x08);
                    prop.Add("LeftIndent", "String", 0x09);
                    prop.Add("RightIndent", "String", 0x0A);
                    prop.Add("HangingIndent", "String", 0x0B);
                    prop.Add("SpaceBefore", "String", 0x0C);
                    prop.Add("SpaceAfter", "String", 0x0D);
                    prop.Add("ParagraphNumber", "Int32", 0x0E);
                    prop.Add("FirstLine", "Boolean", 0x0F);
                    prop.Add("ContentTop", "Single", 0x00);
                    prop.Add("ContentLeft", "Single", 0x01);
                    prop.Add("ContentWidth", "Single", 0x02);
                    prop.Add("ImageConsolidationOffsets", "Object", 0x31, this.WriteJSONImageConsolidationOffsets);
                    prop.Write(this);
                    w.WriteEndObject();
                    w.WriteEndObject();


                    if (RPL.ReadByte() != 0xFF)
                        ThrowParseError("No End Tag");
                }


            }
            else if (RPL.InspectByte() == 0x02)
            {
                RPL.ReadByte();
                long NewIndex = (long)RPL.ReadInt64();
                long CurrIndex = RPL.position;
                RPL.position = NewIndex;
                WriteJSONElements(ObjectType, 1);
                RPL.position = CurrIndex;
                WriteJSONElements(ObjectType, 2);
            }

            return true;

        }
        private Boolean WriteJSONImageDataProperties()
        {
            RPLProperties prop;


            // If this is a Style Property eat the header byte, (for BackgroundImage)
            if (RPL.InspectByte() == 0x21)
                RPL.ReadByte();

            if (RPL.ReadByte() != 0x2A)
                ThrowParseError();

            switch (RPL.ReadByte())
            {
                case 0x02:
                    //Shared Image so unshare
                    int NewIndex = (int)RPL.ReadInt64();
                    DeReference(NewIndex, WriteJSONImageDataProperties);
                    break;
                case 0x00:
                    //Inline
                    RPL.position--;
                    prop = new RPLProperties(0x00);
                    prop.Add("ImageMimeType", "String", 0x00);
                    prop.Add("ImageName", "String", 0x01);
                    prop.Add("Width", "Int32", 0x03);
                    prop.Add("Height", "Int32", 0x04);
                    prop.Add("HorizontalResolution", "Single", 0x05);
                    prop.Add("VerticalResolution", "Single", 0x06);
                    prop.Add("RawFormat", "Byte", 0x07);
                    prop.Add("ImageData", "Object", 0x02, this.WriteJSONImageData);
                    prop.Write(this);
                    break;
                case 0x01:
                    //NonShared
                    RPL.position--;
                    prop = new RPLProperties(0x01);
                    prop.Add("ImageMimeType", "String", 0x00);
                    prop.Add("ImageName", "String", 0x01);
                    prop.Add("Width", "Int32", 0x03);
                    prop.Add("Height", "Int32", 0x04);
                    prop.Add("HorizontalResolution", "Single", 0x05);
                    prop.Add("VerticalResolution", "Single", 0x06);
                    prop.Add("RawFormat", "Byte", 0x07);
                    prop.Add("ImageData", "Object", 0x02, this.WriteJSONImageData);
                    prop.Add("ImageConsolidationOffsets", "Object", 0x31, this.WriteJSONImageConsolidationOffsets);  //TODO:  This is a property that changes per version
                    prop.Write(this);
                    break;


            }

            return true;
        }
        private Boolean WriteJSONImageConsolidationOffsets()
        {
            if (RPL.ReadByte() != 0x31)
                ThrowParseError();

            w.WriteMember("Left");
            w.WriteNumber(RPL.ReadInt32());
            w.WriteMember("Top");
            w.WriteNumber(RPL.ReadInt32());
            w.WriteMember("Width");
            w.WriteNumber(RPL.ReadInt32());
            w.WriteMember("Height");
            w.WriteNumber(RPL.ReadInt32());

            return true;
        }
        private Boolean WriteJSONImageData()
        {
            //Ox27: DynamicImageData
            //0x02: ImageData
            if (RPL.InspectByte() == 0x27 || RPL.InspectByte() == 0x02)
            {
                RPL.position++;

                int Count;
                //w.WriteMember("Count");
                Count = RPL.ReadInt32();
                //w.WriteNumber(Count);

                RPL.position += Count;
                //skip image content, no sense for frontend
                //w.WriteMember("ImageContent");
                //w.WriteStartArray();
                //for (int i = 0; i < Count; i++)
                //    w.WriteNumber(RPL.ReadByte());
                //w.WriteEndArray();
            }
            else
                ThrowParseError();

            return true;
        }
        private Boolean WriteJSONActionImageMapAreas()
        {
            int Count;

            if (RPL.ReadByte() != 0x26)
                ThrowParseError("Not an Image Map Area");

            w.WriteMember("Count");
            Count = RPL.ReadInt32();
            w.WriteNumber(Count);

            w.WriteMember("ActionInfoWithMaps");
            w.WriteStartArray();
            for (int i = 0; i < Count; i++)
            {
                if (RPL.ReadByte() != 0x07)
                    ThrowParseError("Not a Action Info Item");

                w.WriteStartObject();
                if (RPL.InspectByte() == 0x02)
                    WriteJSONActionInfoContent();
                if (RPL.InspectByte() == 0x0A)
                    WriteJSONImageMapAreas();
                if (RPL.ReadByte() != 0xFF)
                    //This should never happen
                    ThrowParseError();
                w.WriteEndObject();
            }

            w.WriteEndArray();

            return true;
        }
        private void WriteJSONImageMapAreas()
        {
            int Count;
            int CorCount;

            if (RPL.ReadByte() == 0x0A)
            {
                w.WriteMember("ImageMapAreas");
                w.WriteStartObject();
                w.WriteMember("Count");
                Count = RPL.ReadInt32();
                w.WriteNumber(Count);

                w.WriteMember("ImageMapArea");
                w.WriteStartArray();
                for (int i = 0; i < Count; i++)
                {
                    w.WriteStartObject();
                    w.WriteMember("ShapeType");
                    w.WriteNumber(RPL.ReadByte());
                    w.WriteMember("CoorCount");
                    CorCount = RPL.ReadInt32();
                    w.WriteNumber(CorCount);
                    w.WriteMember("Coordinates");
                    w.WriteStartArray();
                    for (int j = 0; j < CorCount; j++)
                        w.WriteNumber(RPL.ReadSingle());
                    w.WriteEndArray();
                    if (RPL.ReadByte() != 0xFF)
                    {
                        //This must be a tooltip
                        w.WriteMember("Tooltip");
                        w.WriteString(RPL.ReadString());
                    }
                    w.WriteEndObject();
                }
                w.WriteEndArray();
                w.WriteEndObject();
            }
            else
                ThrowParseError("Not an Image Map Areas Item");
        }
        private void WriteJSONActionInfoContent()
        {
            if (RPL.ReadByte() == 0x02)
                WriteJSONActions();
            else
                ThrowParseError("Not an Action Info Item");

        }
        private Boolean WriteJSONActionInfo()
        {
            if (RPL.InspectByte() == 0x0B || RPL.InspectByte() == 0x07)
            {
                RPL.position++;
                WriteJSONActionInfoContent();

                if (RPL.ReadByte() != 0xFF)
                    ThrowParseError();
            }
            else
                ThrowParseError();
            return true;
        }
        private Boolean WriteJSONActions()
        {
            int Count;
            RPLProperties prop;
            w.WriteMember("Count");
            Count = RPL.ReadInt32();
            w.WriteNumber(Count);

            w.WriteMember("Actions");
            w.WriteStartArray();
            for (int i = 0; i < Count; i++)
            {
                w.WriteStartObject();
                prop = new RPLProperties(0x03);
                prop.Add("Label", "String", 0x04);
                prop.Add("HyperLink", "String", 0x06);
                prop.Add("BookmarkLink", "String", 0x07);
                prop.Add("DrillthroughId", "String", 0x08);
                prop.Add("DrillthroughUrl", "String", 0x09);
                prop.Write(this);
                w.WriteEndObject();
            }

            w.WriteEndArray();

            return true;
        }
        private void WriteJSONMeasurements()
        {
            if (RPL.ReadByte() != 0x10)
                ThrowParseError("Not a Measurement Item");

            w.WriteMember("Measurement");
            w.WriteStartObject();
            w.WriteMember("Offset");
            w.WriteNumber(RPL.ReadInt64());
            w.WriteMember("Count");
            int Count = RPL.ReadInt32();
            w.WriteNumber(Count);

            w.WriteMember("Measurements");
            w.WriteStartArray();
            for (int i = 0; i < Count; i++)
                WriteJSONMeasurement();
            w.WriteEndArray();

            w.WriteEndObject();
        }
        private void WriteJSONMeasurement()
        {


            w.WriteStartObject();
            w.WriteMember("Left");
            w.WriteNumber(RPL.ReadSingle());
            w.WriteMember("Top");
            w.WriteNumber(RPL.ReadSingle());
            w.WriteMember("Width");
            w.WriteNumber(RPL.ReadSingle());
            w.WriteMember("Height");
            w.WriteNumber(RPL.ReadSingle());
            w.WriteMember("zIndex");
            w.WriteNumber(RPL.ReadInt32());
            w.WriteMember("State");
            w.WriteNumber(RPL.ReadByte());
            w.WriteMember("Type");
            w.WriteString(VerifyMeasurementType());
           
            w.WriteEndObject();

        }
        private string VerifyMeasurementType()
        {
            string retval = "";
            long offset = RPL.ReadInt64();
            long CurrIndex = RPL.position;
            RPL.position = offset;

            if (RPL.ReadByte() != 0xFE)
                ThrowParseError("VerifyMeasurementType: Not Report Element End");
            
            long ElementOffset = RPL.ReadInt64();            
            RPL.position = ElementOffset;
            byte ElementType = RPL.ReadByte();

            if (ElementType == 0x10) //Measurements
            {
                ElementOffset = RPL.ReadInt64();
                RPL.position = ElementOffset;
                ElementType = RPL.ReadByte();
            }

            switch (ElementType)
            {
                case 0x04:
                    retval = "PageHeader";
                    break;
                case 0x05:
                    retval = "PageFooter";
                    break;
                case 0x14:
                    retval = "BodyArea";
                    break;
            }
            //Set back
            RPL.position = CurrIndex;
            return retval;

        }
        private Boolean WriteJSONOrigionalValue(byte TypeCode)
        {

            switch (TypeCode)
            {
                case 0x03:
                    w.WriteBoolean(RPL.ReadBoolean());
                    break;
                case 0x04:
                    w.WriteString(RPL.ReadChar().ToString());
                    break;
                case 0x06:
                    w.WriteNumber(RPL.ReadByte());
                    break;
                case 0x07:
                    w.WriteNumber(RPL.ReadInt16());
                    break;
                case 0x09:
                    w.WriteNumber(RPL.ReadInt32());
                    break;
                case 0x0B:
                    w.WriteNumber(RPL.ReadInt64());
                    break;
                case 0x0C:
                    w.WriteNumber(RPL.ReadSingle());
                    break;
                case 0x0D:
                    w.WriteNumber(RPL.ReadFloat());
                    break;
                case 0x0E:
                    w.WriteNumber(RPL.ReadDecimal());
                    break;
                case 0x0F:
                    w.WriteNumber(RPL.ReadDateTime().MiliSec);
                    //TODO Need to write datetime type                        
                    break;
                case 0x11:
                default:
                    w.WriteString(RPL.ReadString());
                    break;
            }

            return true;
        }
        private Boolean WriteJSONReportItems()
        {

            w.WriteStartArray();
            while (WriteJSONReportItem()) ;
            w.WriteEndArray();
            return true;

        }
        private Boolean WriteJSONReportItem(Boolean CheckOnly = false)
        {

            switch (RPL.InspectByte())
            {
                case 0x08:
                    //Line
                    if (!CheckOnly) WriteJSONLine();
                    break;
                case 0x07:
                    //RichText
                    if (!CheckOnly) WriteJSONRichText();
                    break;
                case 0x09:
                    //Image
                    if (!CheckOnly) WriteJSONImage();
                    break;
                case 0x0D:
                    //Tablix
                    if (!CheckOnly) WriteJSONTablix();
                    break;
                case 0x0A:
                    //Rectangle
                    if (!CheckOnly) WriteJSONRectangle();
                    break;
                case 0x0B:
                    if (!CheckOnly) WriteJSONChart();
                    break;
                case 0x0C:
                    if (!CheckOnly) WriteJSONSubreport();
                    break;
                case 0x0E:
                    if (!CheckOnly) WriteJSONGauge();
                    break;
                case 0x15:
                    if (!CheckOnly) WriteJSONMap();
                    break;
                default:
                    return false;
            }
            return true;
        }
        private void WriteJSONRectangle()
        {
            if (RPL.ReadByte() != 0x0A)
                ThrowParseError("Not a Rectangle Item");

            w.WriteStartObject();
            w.WriteMember("Type");
            w.WriteString("Rectangle");

            //Properties
            w.WriteMember("Elements");
            WriteJSONElements();

            w.WriteMember("ReportItems");
            w.WriteStartArray();
            while (WriteJSONReportItem()) ;
            w.WriteEndArray();

            WriteJSONMeasurements();

            WriteJSONReportElementEnd();
            w.WriteEndObject();

        }
        private void WriteJSONTablix()
        {
            if (RPL.ReadByte() != 0x0D)                
                ThrowParseError("Not a Tablix Item");

            w.WriteStartObject();
            w.WriteMember("Type");
            w.WriteString("Tablix");

            //Properties
            w.WriteMember("Elements");
            WriteJSONElements();

            //Tablix Content
            //Either Row or ReportItem
            w.SetShouldWrite(false);
            w.WriteMember("Content");
            w.WriteStartArray();
            while (RPL.InspectByte() == 0x12 || WriteJSONReportItem(true))
            {
                if (RPL.InspectByte() == 0x12)
                {
                    //Tablix Row
                    RPL.ReadByte();  //Read the Token
                    w.WriteStartObject();
                    w.WriteMember("Type");
                    w.WriteString("BodyRow");
                    w.WriteMember("RowIndex");
                    w.WriteNumber(RPL.ReadInt32());
                    //WriteCells
                    LoopObjectArray("Cells", 0x0D, this.WriteJSONCells);
                    //w.WriteEndObject();
                    if (RPL.ReadByte() != 0xFF)
                        ThrowParseError("No End Tag");
                }
                else
                    WriteJSONReportItem();

            }

            w.WriteEndArray();
            w.SetShouldWrite(true);

            //Tablix Structure
            if (RPL.ReadByte() == 0x11)
            {
                w.WriteMember("TablixOffset");
                w.WriteNumber(RPL.ReadInt64());

                RPLProperties prop = new RPLProperties(0xFF);  //No Object Code, use special 0xFF                 
                prop.Add("ColumnHeaderRows", "Int32", 0x00);
                prop.Add("RowHeaderColumns", "Int32", 0x01);
                prop.Add("ColsBeforeRowHeader", "Int32", 0x02);
                prop.Add("LayoutDirection", "Byte", 0x03);
                prop.Add("ColumnWidths", "Object", 0x04, this.WriteJSONColumnWidths);
                prop.Add("RowHeights", "Object", 0x05, this.WriteJSONRowHeights);
                prop.Add("ContentTop", "Singe", 0x06);
                prop.Add("ContentLeft", "Singe", 0x07);
                prop.Add("TablixRowMembersDef", "Object", 0x0E, this.WriteJSONTablixRowMemeber);
                prop.Add("TablixColMembersDef", "Object", 0x0F, this.WriteJSONTablixColMemeber);
                prop.Write(this, 0x08);

                //We are now Tablix Rows 
                RPL.position--;
                LoopObjectArray("TablixRows", 0x08, this.WriteJSONTablixRow);
                if (RPL.ReadByte() != 0xFF)
                    ThrowParseError("No End Tag");
            }
            else
                ThrowParseError("Not a Tablix Structure");

            WriteJSONReportElementEnd();
            w.WriteEndObject();

        }


        private Boolean WriteJSONDeRefCellReportItem()
        {
            if (RPL.ReadByte() != 0x04)
                ThrowParseError("Not a Cell Reference");

            long StartIndex = RPL.ReadInt64();
            long CurrIndex = RPL.position;
            RPL.position = StartIndex;


            if (RPL.ReadByte() != 0xFE)
                ThrowParseError("Not a Report Elememt End");

            //Jump to start of ReportItemEnd  This is differnt for each report item             
            RPL.position = RPL.ReadInt64();
            switch (RPL.InspectByte())
            {
                case 0x12:
                    //Rich textbox structure
                    RPL.ReadByte();
                    RPL.position = RPL.ReadInt64();
                    break;
                case 0x11:
                    //Tablix Structure
                    RPL.ReadByte();
                    RPL.position = RPL.ReadInt64();
                    break;
                case 0x10:
                    //Rectangle measurements
                    RPL.ReadByte();
                    RPL.position = RPL.ReadInt64();
                    break;
                default:
                    break;
            }
            w.WriteMember("ReportItem");
            WriteJSONReportItem();


            //Set back
            RPL.position= CurrIndex;
            return true;

        }
        private void WriteJSONDeRefTablixBodyCells()
        {
            long StartIndex = RPL.ReadInt64();
            long CurrIndex = RPL.position;
            RPL.position = StartIndex;


            if (RPL.ReadByte() != 0x12)
                ThrowParseError("Not a Cell Reference");

            //Tablix Row
            w.WriteStartObject();
            w.WriteMember("Type");
            w.WriteString("BodyRow");
            w.WriteMember("RowIndex");
            w.WriteNumber(RPL.ReadInt32());
            //WriteCells
            LoopObjectArray("Cells", 0x0D, this.WriteJSONCells);
            w.WriteEndObject();
            if (RPL.ReadByte() != 0xFF)
                ThrowParseError("No End Tag");

            //Set back
            RPL.position = CurrIndex;
        }
        private Boolean WriteJSONTablixRow()
        {
            RPLProperties prop;

            while (RPL.InspectByte() == 0x0A || RPL.InspectByte() == 0x0B || RPL.InspectByte() == 0x0C || RPL.InspectByte() == 0x09)
            {
                switch (RPL.InspectByte())
                {
                    case 0x0A:
                        //Corner     
                        w.WriteStartObject();
                        w.WriteMember("Type");
                        w.WriteString("Corner");
                        prop = new RPLProperties(0x0A);
                        prop.Add("Cell", "Object", 0x04, this.WriteJSONDeRefCellReportItem);
                        prop.Add("ColSpan", "Int32", 0x05);
                        prop.Add("RowSpan", "Int32", 0x06);
                        prop.Add("ColumnIndex", "Int32", 0x08);
                        prop.Add("RowIndex", "Int32", 0x09);
                        prop.Add("CellItemState", "Byte", 0x0D);
                        prop.Add("ContentTop", "Single", 0x00);
                        prop.Add("ContentLeft", "Single", 0x01);
                        prop.Add("ContentWidth", "Single", 0x02);
                        prop.Add("ContentHeight", "Single", 0x03);
                        prop.Write(this);
                        w.WriteEndObject();
                        break;
                    case 0x0B:
                        //TablixColumnHeader   
                        w.WriteStartObject();
                        w.WriteMember("Type");
                        w.WriteString("ColumnHeader");
                        prop = new RPLProperties(0x0B);
                        prop.Add("Cell", "Object", 0x04, this.WriteJSONDeRefCellReportItem);
                        prop.Add("ColSpan", "Int32", 0x05);
                        prop.Add("RowSpan", "Int32", 0x06);
                        prop.Add("ColumnIndex", "Int32", 0x08);
                        prop.Add("RowIndex", "Int32", 0x09);
                        prop.Add("CellItemState", "Byte", 0x0D);
                        prop.Add("ContentTop", "Single", 0x00);
                        prop.Add("ContentLeft", "Single", 0x01);
                        prop.Add("ContentWidth", "Single", 0x02);
                        prop.Add("ContentHeight", "Single", 0x03);

                        prop.Add("DefIndex", "Int32", 0x07);
                        prop.Add("GroupLabel", "String", 0x0A);
                        prop.Add("UniqueName", "String", 0x0B);
                        prop.Add("State", "Byte", 0x0C);
                        prop.Add("RecursiveToggleLevel", "Int32", 0x0E);

                        prop.Write(this);
                        w.WriteEndObject();

                        break;
                    case 0x0C:
                        //TablixRowHeader         
                        w.WriteStartObject();
                        w.WriteMember("Type");
                        w.WriteString("RowHeader");
                        prop = new RPLProperties(0x0C);
                        prop.Add("Cell", "Object", 0x04, this.WriteJSONDeRefCellReportItem);
                        prop.Add("ColSpan", "Int32", 0x05);
                        prop.Add("RowSpan", "Int32", 0x06);
                        prop.Add("ColumnIndex", "Int32", 0x08);
                        prop.Add("RowIndex", "Int32", 0x09);
                        prop.Add("CellItemState", "Byte", 0x0D);
                        prop.Add("ContentTop", "Single", 0x00);
                        prop.Add("ContentLeft", "Single", 0x01);
                        prop.Add("ContentWidth", "Single", 0x02);
                        prop.Add("ContentHeight", "Single", 0x03);

                        prop.Add("DefIndex", "Int32", 0x07);
                        prop.Add("GroupLabel", "String", 0x0A);
                        prop.Add("UniqueName", "String", 0x0B);
                        prop.Add("State", "Byte", 0x0C);
                        prop.Add("RecursiveToggleLevel", "Int32", 0x0E);

                        prop.Write(this);
                        w.WriteEndObject();

                        break;
                    case 0x09:
                        //Tablix Body Cell      
                        RPL.position++;
                        WriteJSONDeRefTablixBodyCells();
                        break;
                    default:
                        ThrowParseError();
                        break;
                }

            }
            if (RPL.ReadByte() != 0xFF)
                ThrowParseError("No End Tag");

            return true;
        }
        private Boolean WriteJSONTablixColMemeber()
        {
            int Count;
            if (RPL.ReadByte() != 0x0F)
                ThrowParseError("Not a Column Imem");

            w.WriteMember("ColMemberDefCount");
            Count = RPL.ReadInt32();
            w.WriteNumber(Count);

            w.WriteMember("ColMemberDefs");
            w.WriteStartArray();
            for (int i = 0; i < Count; i++)
                WriteJSONMemberDefs();
            w.WriteEndArray();

            return true;
        }
        private void WriteJSONMemberDefs()
        {
            RPLProperties prop;

            if (RPL.ReadByte() != 0x10)
                ThrowParseError("Not a MememberDef Item");

            w.WriteStartObject();

            prop = new RPLProperties(0xFF);
            prop.Add("DefinitionPath", "String", 0x00);
            prop.Add("Level", "Int32", 0x01);
            prop.Add("MemberCellIndex", "Int32", 0x02);
            prop.Add("MemberDefState", "Byte", 0x03);
            prop.Write(this);
            w.WriteEndObject();

        }
        private Boolean WriteJSONTablixRowMemeber()
        {
            int Count;

            if (RPL.ReadByte() != 0x0E)
                ThrowParseError("Not a Row Memeber");

            w.WriteMember("RowMemberDefCount");
            Count = RPL.ReadInt32();
            w.WriteNumber(Count);

            w.WriteMember("RowMemeberDefs");
            w.WriteStartArray();
            for (int i = 0; i < Count; i++)
                WriteJSONMemberDefs();
            w.WriteEndArray();

            return true;
        }
        private Boolean WriteJSONColumnWidths()
        {
            int Count;

            if (RPL.ReadByte() != 0x04)
                ThrowParseError("Not a Column Width Item");

            w.WriteMember("ColumnCount");
            Count = RPL.ReadInt32();
            w.WriteNumber(Count);

            w.WriteMember("Columns");
            w.WriteStartArray();
            for (int i = 0; i < Count; i++)
            {
                w.WriteStartObject();
                w.WriteMember("Width");
                w.WriteNumber(RPL.ReadSingle());
                w.WriteMember("FixColumn");
                w.WriteNumber(RPL.ReadByte());
                w.WriteEndObject();
            }
            w.WriteEndArray();

            return true;
        }
        private Boolean WriteJSONRowHeights()
        {
            int Count;

            if (RPL.ReadByte() != 0x05)
                ThrowParseError("Not a Row Height Item");

            w.WriteMember("RowCount");
            Count = RPL.ReadInt32();
            w.WriteNumber(Count);

            w.WriteMember("Rows");
            w.WriteStartArray();
            for (int i = 0; i < Count; i++)
            {
                w.WriteStartObject();
                w.WriteMember("Height");
                w.WriteNumber(RPL.ReadSingle());
                w.WriteMember("FixRows");
                w.WriteNumber(RPL.ReadByte());
                w.WriteEndObject();
            }
            w.WriteEndArray();

            return true;
        }
        private Boolean WriteJSONCells()
        {
            RPLProperties prop = new RPLProperties(0xFF);


            w.WriteStartObject();
            prop.Add("Cell", "Object", 0x04, this.WriteJSONDeRefCellReportItem);
            prop.Add("ColSpan", "Int32", 0x05);
            prop.Add("RowSpan", "Int32", 0x06);
            prop.Add("ColumnIndex", "Int32", 0x08);
            prop.Add("CellItemState", "Byte", 0x0D);
            prop.Add("ContentTop", "Singe", 0x00);
            prop.Add("ContentLeft", "Singe", 0x01);
            prop.Add("ContentWidth", "String", 0x02);
            prop.Add("ContentHeight", "Singe", 0x03);
            prop.Write(this);

            w.WriteEndObject();

            return true;
        }
        private void WriteJSONRichText()
        {
            if (RPL.ReadByte() != 0x07)
                ThrowParseError("Not a Rich Text Item");  //This should never happen

            w.WriteStartObject();
            w.WriteMember("Type");
            w.WriteString("RichTextBox");

            //Properties
            w.WriteMember("Elements");
            WriteJSONElements();

            //Paragraphs
            w.WriteMember("Paragraphs");
            w.WriteStartArray();
            while (RPL.InspectByte() == 0x14)
            {
                w.WriteStartObject();
                LoopObjectArray("TextRuns", 0x14, this.WriteJSONTextRun);
                WriteJSONParagraph();
                w.WriteEndObject();
            }
            w.WriteEndArray();

            //Paragraph Structure
            w.WriteMember("RichTextBoxStructure");
            w.WriteStartObject();
            if (RPL.ReadByte() == 0x12)
            {

                w.WriteMember("TokenOffset");
                w.WriteNumber(RPL.ReadInt64());
                w.WriteMember("ParagraphCount");
                int ParCount = RPL.ReadInt32();
                w.WriteNumber(ParCount);
                w.WriteMember("ParagraphOffsets");
                w.WriteStartArray();
                for (int i = 0; i < ParCount; i++)
                    w.WriteNumber(RPL.ReadInt64());
                w.WriteEndArray();
                if (RPL.ReadByte() != 0xFF)
                    ThrowParseError("No End Tag");
            }
            else
                ThrowParseError("Not a Paragraph Structure");
            w.WriteEndObject();

            WriteJSONReportElementEnd();
            w.WriteEndObject();

        }

        private Boolean WriteJSONParagraphProperties()
        {
            RPLProperties prop;

            if (RPL.ReadByte() != 0x0F)
                ThrowParseError();

            switch (RPL.InspectByte())
            {
                case 0x02:
                    //Shared Image so unshare
                    RPL.position++;
                    long NewIndex = RPL.ReadInt64();
                    DeReference(NewIndex, this.WriteJSONParagraphProperties);
                    break;
                case 0x00:
                    //Shared Properties
                    //w.WriteMember("SharedElements");                    
                    tmpWriter.WriteStartObject();
                    prop = new RPLProperties(0x00);
                    prop.Add("SID", "String", 0x05);
                    prop.Add("Style", "Object", 0x06, this.WriteJSONSharedStyle);
                    prop.Add("ListStyle", "Byte", 0x07);
                    prop.Add("ListLevel", "Int32", 0x08);
                    prop.Add("LeftIndent", "String", 0x09);
                    prop.Add("RightIndent", "String", 0x0A);
                    prop.Add("HangingIndent", "String", 0x0B);
                    prop.Add("SpaceBefore", "String", 0x0C);
                    prop.Add("SpaceAfter", "String", 0x0D);
                    prop.Add("ContentHeight", "Single", 0x03);
                    prop.Write(this, tmpWriter);
                    tmpWriter.WriteEndObject();
                    SaveSharedStyle();

                    break;
            }

            //NonShared                     
            if (RPL.InspectByte() == 0x01)
            {
                prop = new RPLProperties(0x01);
                w.WriteMember("NonSharedElements");
                w.WriteStartObject();
                prop.Add("UniqueName", "String", 0x04);
                prop.Add("Style", "Object", 0x06, this.WriteJSONNonSharedStyle);
                prop.Add("ListStyle", "Byte", 0x07);
                prop.Add("ListLevel", "Int32", 0x08);
                prop.Add("LeftIndent", "String", 0x09);
                prop.Add("RightIndent", "String", 0x0A);
                prop.Add("HangingIndent", "String", 0x0B);
                prop.Add("SpaceBefore", "String", 0x0C);
                prop.Add("SpaceAfter", "String", 0x0D);
                prop.Add("ParagraphNumber", "Int32", 0x0E);
                prop.Add("FirstLine", "Byte", 0x0F);
                prop.Add("ContentTop", "Single", 0x00);
                prop.Add("ContentLeft", "Single", 0x01);
                prop.Add("ContentWidth", "Single", 0x02);
                prop.Add("ContentHeight", "Single", 0x03);
                prop.Write(this);
                w.WriteEndObject();
            }

            return true;
        }
        private Boolean WriteJSONParagraph()
        {
            if (RPL.ReadByte() == 0x13)
            {
                w.WriteMember("Paragraph");
                //WriteJSONElements();

                w.WriteStartObject();
                WriteJSONParagraphProperties();
                if (RPL.ReadByte() != 0xFF)
                    ThrowParseError("No End Tag");
                w.WriteEndObject();
                //TextRuns
                w.WriteMember("TextRunCount");
                int Count = RPL.ReadInt32();
                w.WriteNumber(Count);
                w.WriteMember("TextRunOffsets");
                w.WriteStartArray();
                for (int i = 0; i < Count; i++)
                    w.WriteNumber(RPL.ReadInt64());
                w.WriteEndArray();
                if (RPL.ReadByte() != 0xFF)                    
                    ThrowParseError("No End Tag");
            }
            else
                ThrowParseError("Not a Paragraph");

            return true;
        }

        private Boolean WriteJSONTextRunElements()
        {
            byte elementBeginMarker = RPL.ReadByte();
            if (elementBeginMarker != 0x0F)
            {
                ThrowParseError("Not a Text Run");
            }
            RPLProperties prop;
            switch (RPL.InspectByte())
            {
                case 0x02:
                    //Shared Image so unshare
                    RPL.position++;
                    long NewIndex = RPL.ReadInt64();
                    DeReference(NewIndex, WriteJSONTextRunElements);
                    break;
                case 0x00:
                    //Shared Properties
                    //w.WriteMember("SharedElements");
                    
                    tmpWriter.WriteStartObject();
                    prop = new RPLProperties(0x00);
                    prop.Add("SID", "String", 0x05);
                    prop.Add("Style", "Object", 0x06, this.WriteJSONSharedStyle);
                    prop.Add("Markup", "Byte", 0x07);
                    prop.Add("Label", "String", 0x08);
                    prop.Add("Tooltip", "String", 0x09);
                    prop.Add("Value", "String", 0x0A);
                    prop.Add("Formula", "String", 0x0C);
                    prop.Add("ContentHeight", "Single", 0x03);
                    prop.Write(this, tmpWriter);
                    tmpWriter.WriteEndObject();
                    SaveSharedStyle();
                    break;
                default:
                    // Write empty shared element if there is no shared element.
                    w.WriteMember("SharedElements");
                    w.WriteStartObject();
                    w.WriteEndObject();
                    break;

            }

            //NonShared                     
            if (RPL.InspectByte() == 0x01)
            {
                prop = new RPLProperties(0x01);
                w.WriteMember("NonSharedElements");
                w.WriteStartObject();
                prop.Add("UniqueName", "String", 0x04);
                prop.Add("Markup", "Byte", 0x07);
                prop.Add("Style", "Object", 0x06, this.WriteJSONNonSharedStyle);
                prop.Add("Label", "String", 0x08);
                prop.Add("Tooltip", "String", 0x09);
                prop.Add("Value", "String", 0x0A);
                prop.Add("ActionInfo", "Object", 0x0B, this.WriteJSONActionInfo);
                prop.Add("ProcessedWithError", "Byte", 0x0D);
                prop.Add("ContentTop", "Single", 0x00);
                prop.Add("ContentLeft", "Single", 0x01);
                prop.Add("ContentWidth", "Single", 0x02);
                prop.Add("ContentHeight", "Single", 0x03);
                prop.Write(this);

                w.WriteEndObject();
            }
            return true;
        }
        private Boolean WriteJSONTextRun()
        {
            //Properties
            w.WriteStartObject();
            w.WriteMember("Elements");
            
            w.WriteStartObject();
            WriteJSONTextRunElements();
            if (RPL.ReadByte() != 0xFF)
                ThrowParseError("No end marker");
            w.WriteEndObject();

            byte elementEndMarker = RPL.ReadByte();
            if (elementEndMarker != 0xFF)
                ThrowParseError();

            w.WriteEndObject();
            return true;
        }
        private void WriteJSONImage()
        {
            WriteJSONImageTypeElement(0x09, "Image");
        }
        private void WriteJSONChart()
        {
            WriteJSONImageTypeElement(0x0B, "Chart");
        }
        private void WriteJSONMap()
        {
            WriteJSONImageTypeElement(0x15, "Map");
        }
        private void WriteJSONGauge()
        {
            WriteJSONImageTypeElement(0x0E, "Gauge");
        }
        private void WriteJSONImageTypeElement(byte type, string typeName)
        {
            if (RPL.ReadByte() != type)
                ThrowParseError();

            w.WriteStartObject();
            w.WriteMember("Type");
            w.WriteString(typeName);
            w.WriteMember("Elements");
            WriteJSONElements();
            WriteJSONReportElementEnd();
            w.WriteEndObject();

        }
        private void WriteJSONSubreport()
        {
            if (RPL.ReadByte() != 0x0C)
                ThrowParseError();

            w.WriteStartObject();
            w.WriteMember("Type");
            w.WriteString("SubReport");
            w.WriteMember("SubReportProperties");
            WriteJSONElements();
            w.WriteMember("BodyElements");
            WriteJSONBodyElement();

            WriteJSONMeasurements();

            WriteJSONReportElementEnd();
            w.WriteEndObject();
        }
        private void WriteJSONLine()
        {
            if (RPL.ReadByte() != 0x08)
                ThrowParseError();  //This should never happen

            w.WriteStartObject();
            w.WriteMember("Type");
            w.WriteString("Line");
            w.WriteMember("Elements");
            WriteJSONElements();
            WriteJSONReportElementEnd();
            w.WriteEndObject();

        }
        private void WriteJSONReportElementEnd()
        {
            if (RPL.ReadByte() == 0xFE)
            {
                w.WriteMember("OffsetRef");
                w.WriteNumber(RPL.ReadInt64());
            }
            else
                ThrowParseError("No Offset Tag");

            //Must be the end
            if (RPL.ReadByte() != 0xFF)
                ThrowParseError("No End Tag");

        }

        private Boolean WriteJSONSharedStyle()
        {
            return WriteJSONStyle(tmpWriter);
        }
        private Boolean WriteJSONNonSharedStyle()
        {
            return WriteJSONStyle(w);
        }
        private Boolean WriteJSONStyle(JsonWriter jw)
        {
            if (RPL.ReadByte() != 0x06)                
                ThrowParseError("Not a Style Element");
            RPLProperties prop;

            if (RPL.InspectByte() == 0x00)
                prop = new RPLProperties(0x00);
            else
                prop = new RPLProperties(0x01);


            prop.Add("BorderColor", "String", 0x00);
            prop.Add("BorderColorLeft", "String", 0x01);
            prop.Add("BorderColorRight", "String", 0x02);
            prop.Add("BorderColorTop", "String", 0x03);
            prop.Add("BorderColorBottom", "String", 0x04);
            prop.Add("BorderStyle", "Byte", 0x05);
            prop.Add("BorderStyleLeft", "Byte", 0x06);
            prop.Add("BorderStyleRight", "Byte", 0x07);
            prop.Add("BorderStyleTop", "Byte", 0x08);
            prop.Add("BorderStyleBottom", "Byte", 0x09);
            prop.Add("BorderWidth", "String", 0x0A);
            prop.Add("BorderWidthLeft", "String", 0x0B);
            prop.Add("BorderWidthRight", "String", 0x0C);
            prop.Add("BorderWidthTop", "String", 0x0D);
            prop.Add("BorderWidthBottom", "String", 0x0E);
            prop.Add("PaddingLeft", "String", 0x0F);
            prop.Add("PaddingRight", "String", 0x10);
            prop.Add("PaddingTop", "String", 0x11);
            prop.Add("PaddingBottom", "String", 0x12);
            prop.Add("FontStyle", "Byte", 0x13);
            prop.Add("FontFamily", "String", 0x14);
            prop.Add("FontSize", "String", 0x15);
            prop.Add("FontWeight", "Byte", 0x16);
            prop.Add("Format", "String", 0x17);
            prop.Add("TextDecoration", "Byte", 0x18);
            prop.Add("TextAlign", "Byte", 0x19);
            prop.Add("VerticalAlign", "Byte", 0x1A);
            prop.Add("Color", "String", 0x1B);
            prop.Add("LineHeight", "String", 0x1C);
            prop.Add("Direction", "Byte", 0x1D);
            prop.Add("WritingMode", "Byte", 0x1E);
            prop.Add("UnicodeBiDi", "Byte", 0x1F);
            prop.Add("Language", "String", 0x20);
            prop.Add("BackgroundImage", "Object", 0x21, WriteJSONImageDataProperties);
            prop.Add("BackgroundColor", "String", 0x22);
            prop.Add("BackgroundRepeat", "Byte", 0x23);
            prop.Add("NumeralLanguage", "String", 0x24);
            prop.Add("NumeralVariant", "Int32", 0x25);
            prop.Add("Calendar", "Byte", 0x26);

            prop.Write(this, jw);
            return true;
        }
        private void WriteJSONRepProp()
        {

            RPLProperties prop = new RPLProperties(0x02);

            prop.Add("Description", "String", 0x09);
            prop.Add("Location", "String", 0x0A);
            prop.Add("Language", "String", 0x0B);
            prop.Add("ExecTime", "DateTime", 0x0C);
            prop.Add("Author", "String", 0x0D);
            prop.Add("AutoRefresh", "Int32", 0x0E);
            prop.Add("ReportName", "String", 0x0F);
            prop.Add("ConsumeContainerWhiteSpace", "Boolean", 0x32);

            prop.Write(this);

        }

        
        protected virtual void Dispose(bool disposing)
        {
            if (disposing)
            {
                w.Close();                
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }

    class RPLDateTime
    {
        public int Type;
        public Int64 MiliSec;

    }

    internal class RPLReader
    {
        Stream RPL;

        public RPLReader(Stream RPL)
        {
            this.RPL = RPL;
        }

        public Stream RPLStream
        {
            get { return this.RPL; }
        }

        public long position
        {
            get { return RPL.Position; }
            set { RPL.Position = value; }
        }
        public byte[] GetByteArray(int size)
        {
            byte[] val = new byte[size];
            RPL.Read(val, 0, size);
            return val;
        }
        public int ReadInt32()
        {
            int retval = BitConverter.ToInt32(GetByteArray(4), 0);
            return retval;
        }
        public Int64 ReadInt64()
        {
            Int64 retval = BitConverter.ToInt64(GetByteArray(8), 0);
            return retval;
        }
        public RPLDateTime ReadDateTime()
        {
            RPLDateTime retval = new RPLDateTime();
            Int64 dt = ReadInt64();
            byte b = (byte)dt;

            retval.Type = b >> 2;
            retval.MiliSec = dt << 2;
            return retval;
        }
        public short ReadInt16()
        {
            short retval = BitConverter.ToInt16(GetByteArray(2), 0);
            return retval;
        }
        public float ReadSingle()
        {
            float retval = BitConverter.ToSingle(GetByteArray(4), 0);
            return retval;
        }
        public double ReadFloat()
        {
            double retval = BitConverter.ToDouble(GetByteArray(8), 0);
            return retval;
        }
        public char ReadChar()
        {
            char retval = Encoding.Unicode.GetChars(GetByteArray(2), 0, 2)[1];
            return retval;
        }
        public byte ReadByte()
        {
            byte retval = GetByteArray(1)[0];
            return retval;
        }
        public byte InspectByte()
        {
            byte retval = GetByteArray(1)[0];
            this.position--;
            return retval;
        }
        public decimal ReadDecimal()
        {
            int[] bits = new int[4];
            bits[0] = ReadInt32();
            bits[2] = ReadInt32();
            bits[3] = ReadInt32();
            bits[4] = ReadInt32();

            decimal retval = new decimal(bits);
            return retval;
        }
        public Boolean ReadBoolean()
        {
            Boolean retval;

            if (ReadByte() == 1)
                retval = true;
            else
                retval = false;
            return retval;
        }
        public string ReadString()
        {
            int length;
            string retval;

            length = GetLength(0);
            retval = Encoding.Unicode.GetString(GetByteArray(length), 0, length);
            return retval;

        }
        public int GetLength(int Depth)
        {
            int Len;
            int retval;

            Len = ReadByte();
            if (Len > 127)
            {
                retval = Len - 128;
                retval += GetLength(Depth + 1) *  128;
            }
            else
                retval = Len;

            return retval;

        }

    }    
}
