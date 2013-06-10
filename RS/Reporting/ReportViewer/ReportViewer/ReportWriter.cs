using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Jayrock.Json;
using Forerunner.RSExec;
using System.IO;
using System.Diagnostics;
using System.Reflection;

namespace Forerunner
{

    class ReportJSONWriter
    {
        byte[] RPL;
        int Index = 0;
        JsonWriter w = new JsonTextWriter();
        byte majorVersion;
        byte minorVersion;
        Dictionary<string, TempProperty> TempPropertyBag = new Dictionary<string,TempProperty>() ;

        class TempProperty
        {
            public string Name;
            public string Type;
            public object Value;
        }

        class RPLDateTime
        {
            public int Type;
            public Int64 MiliSec;

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
                    //Need to Grow, throuw for now
                    ThrowParseError();

                PropArray[NumProp] = new RPLProperty();
                PropArray[NumProp].Name = Name;
                PropArray[NumProp].DataType = Type;
                PropArray[NumProp].RPLCode = Code;
                PropArray[NumProp].ObjFunction2 = f;
                PropArray[NumProp].MakeTemp = MakeTemp;
                NumProp++;
            }

            public void Add(string Name, string Type, byte Code, Func<Boolean> f = null,Boolean MakeTemp = false)
            {
                if (NumProp == PropArray.GetUpperBound(0))
                    //Need to Grow, throuw for now
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
                    //Need to Grow, throuw for now
                    ThrowParseError();

                PropArray[NumProp] = new RPLProperty();
                PropArray[NumProp].Name = Name;
                PropArray[NumProp].DataType = Type;
                PropArray[NumProp].RPLCode = Code;
                PropArray[NumProp].MakeTemp = MakeTemp;
                NumProp++;
            }

            public void WriteMemeber(byte Code, ReportJSONWriter r)
            {
                int i;
                JsonWriter w = r.w;


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
                            if (PropArray[i].MakeTemp) tmp.Value = r.ReadInt32(); else w.WriteNumber(r.ReadInt32());                            
                            break;
                        case "Int64":
                            if (PropArray[i].MakeTemp) tmp.Value = r.ReadInt64(); else w.WriteNumber(r.ReadInt64());
                            break;
                        case "Int16":
                            if (PropArray[i].MakeTemp) tmp.Value = r.ReadInt16(); else w.WriteNumber(r.ReadInt16());
                            break;
                        case "String":
                            if (PropArray[i].MakeTemp) tmp.Value = r.ReadString(); else w.WriteString(r.ReadString());
                            break;
                        case "Float":
                            if (PropArray[i].MakeTemp) tmp.Value = r.ReadFloat(); else w.WriteNumber(r.ReadFloat());                            
                            break;
                        case "Single":
                            if (PropArray[i].MakeTemp) tmp.Value = r.ReadSingle(); else w.WriteNumber(r.ReadSingle());                            
                            break;
                        case "Char":
                            if (PropArray[i].MakeTemp) tmp.Value = r.ReadChar().ToString(); else w.WriteString(r.ReadChar().ToString());                            
                            break;
                        case "DateTime":
                            if (PropArray[i].MakeTemp) tmp.Value = r.ReadDateTime().MiliSec; else w.WriteNumber(r.ReadDateTime().MiliSec);                            
                            //TODO Need to write datetime type
                            break;
                        case "Decimal":
                            if (PropArray[i].MakeTemp) tmp.Value = r.ReadDecimal(); else w.WriteNumber(r.ReadDecimal()); 
                            break;
                        case "Boolean":
                            if (PropArray[i].MakeTemp) tmp.Value = r.ReadBoolean(); else w.WriteBoolean(r.ReadBoolean()); 
                            break;
                        case "Byte":
                            //This is a Total Hack for OrigionalValue
                            //TypeCode is guarenteed to come  before OrigionalValue
                            if (PropArray[i].Name == "TypeCode")
                            {
                                TypeCode = r.ReadByte();
                                w.WriteNumber(TypeCode);
                            }
                            else
                                if (PropArray[i].MakeTemp) tmp.Value = r.ReadByte(); else w.WriteNumber(r.ReadByte()); 
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
                                r.Seek(-1);
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
                //TODO Throw correct, this should not happen
                throw new IndexOutOfRangeException();
            }

            public void Write(ReportJSONWriter r, Byte EndCode = 0xFF)
            {
                //If RPLPRopertyBagCode is 0xFF then there is no Object code just arbitrary properties
                if (RPLPropBagCode == 0xFF)
                {
                    byte isEnd = r.ReadByte();
                    while (isEnd != EndCode)
                    {
                        WriteMemeber(isEnd, r);
                        isEnd = r.ReadByte();
                    }
                }
                else if (r.ReadByte() == RPLPropBagCode)
                {
                    byte isEnd = r.ReadByte();
                    while (isEnd != EndCode)
                    {
                        WriteMemeber(isEnd, r);
                        isEnd = r.ReadByte();
                    }
                }
                else
                    ThrowParseError();
            }

        }

        public ReportJSONWriter(){}

        public string RPLToJSON(byte[] RPL, string SessionID, string ReportServerURL, string reportPath, int NumPages, DocumentMapNode DocumentMap = null)
        {

            this.RPL = RPL;

            //Read Report Object
            w.WriteStartObject();
            w.WriteMember("SessionID");
            w.WriteString(SessionID);
            w.WriteMember("ReportServerURL");
            w.WriteString(ReportServerURL);
            w.WriteMember("ReportPath");
            w.WriteString(reportPath);
            w.WriteMember("NumPages");
            w.WriteNumber(NumPages);
            w.WriteMember("RPLStamp");
            w.WriteString(ReadString());

            //Version
            WriteJSONVersion();

            //Report Start
            if (ReadByte() == 0x00)
            {
                w.WriteMember("Report");
                w.WriteStartObject();

                //Report Porperties            
                WriteJSONRepProp();

                //Report Content
                WriteJSONReportContent();

                //Document Map
                if (DocumentMap != null)
                {
                    w.WriteMember("DocumentMap");
                    w.WriteStartObject();
                    ConvertDocumentMapToJSON(DocumentMap);
                    w.WriteEndObject();
                }

                //End Report
                w.WriteEndObject();
            }

            //End RPL
            w.WriteEndObject();

            Debug.WriteLine(w.ToString());
            return w.ToString();

        }

        public string ConvertParamemterToJSON(ReportParameter[] parametersList, string SessionID, string ReportServerURL, string reportPath, int NumPages)
        {
            JsonWriter w = new JsonTextWriter();
            w.WriteStartObject();
            w.WriteMember("SessionID");
            w.WriteString(SessionID);
            w.WriteMember("ReportServerURL");
            w.WriteString(ReportServerURL);
            w.WriteMember("ReportPath");
            w.WriteString(reportPath);
            w.WriteMember("NumPages");
            w.WriteNumber(NumPages);

            w.WriteMember("Type");
            w.WriteString("Parameters");
            w.WriteMember("Count");
            w.WriteString(parametersList.Length.ToString());
            w.WriteMember("ParametersList");
            w.WriteStartArray();
            foreach (ReportParameter parameter in parametersList)
            {
                w.WriteStartObject();
                foreach (PropertyInfo proInfo in parameter.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance))
                {
                    if (!proInfo.PropertyType.IsArray)
                    {
                        w.WriteMember(proInfo.Name);
                        Object obj = proInfo.GetValue(parameter, null);

                        if (obj == null)
                            w.WriteString("");
                        else
                            w.WriteString(proInfo.GetValue(parameter, null).ToString());
                    }
                }

                w.WriteMember("DefaultValues");
                if (parameter.DefaultValues != null)
                {
                    w.WriteStartArray();
                    foreach (string item in parameter.DefaultValues)
                    {
                        w.WriteString(item);
                    }
                    w.WriteEndArray();
                }
                else
                    w.WriteString("");


                w.WriteMember("Dependencies");
                if (parameter.Dependencies != null)
                {
                    w.WriteStartArray();
                    foreach (string item in parameter.Dependencies)
                    {
                        w.WriteString(item);
                    }
                    w.WriteEndArray();
                }
                else
                    w.WriteString("");

                w.WriteMember("ValidValues");
                if (parameter.ValidValues != null)
                {
                    w.WriteStartArray();
                    foreach (ValidValue item in parameter.ValidValues)
                    {
                        w.WriteStartObject();
                        w.WriteMember("Key");
                        w.WriteString(item.Label);
                        w.WriteMember("Value");
                        w.WriteString(item.Value);
                        w.WriteEndObject();
                    }
                    w.WriteEndArray();
                }
                else
                    w.WriteString("");
                w.WriteEndObject();
            }

            w.WriteEndArray();

            w.WriteEndObject();

            return w.ToString();
        }

        public void ConvertDocumentMapToJSON(DocumentMapNode DocumentMap)
        {
            w.WriteMember("Label");
            w.WriteString(DocumentMap.Label);
            w.WriteMember("UniqueName");
            w.WriteString(DocumentMap.UniqueName);
            if (DocumentMap.Children != null)
            {
                w.WriteMember("Children");
                w.WriteStartArray();
                foreach (DocumentMapNode Child in DocumentMap.Children)
                {
                    w.WriteStartObject();
                    ConvertDocumentMapToJSON(Child);
                    w.WriteEndObject();
                }
                w.WriteEndArray();
            }
        }

        private Boolean DeReference(int StartIndex, Func<Boolean> DeFunction)
        {

            int CurrIndex = this.Index;
            this.Index = StartIndex;
            DeFunction();
            this.Index = CurrIndex;
            return true;
        }
        private void ThrowParseError()
        {
            //TODO Throw correct, this should not happen
            throw new IndexOutOfRangeException();
        }
        private Boolean LoopObjectArray(string ArrayName, byte Code, Func<Boolean> f)
        {
            w.WriteMember(ArrayName);
            w.WriteStartArray();
            while (ReadByte() == Code)
                f();
            w.WriteEndArray();

            //Reset Object since this is the end of the array
            Seek(-1);
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
                    ThrowParseError();
                    break;

            }
            

        }
        private void WriteJSONReportContent()
        {

            if (ReadByte() == 0x13)
            {

                if (checkVersion(10,6) || checkVersion(10,4) || checkVersion(10,5))
                {
                    w.WriteMember("PageContent");
                    w.WriteStartObject();

                    //PageLayout Start
                    w.WriteMember("PageLayoutStart");
                    w.WriteStartObject();
                    WriteJSONPageProp();
                    w.WriteEndObject();

                    //Sections
                    LoopObjectArray("Sections", 0x15, this.WriteJSONSections);

                    //Measurments
                    WriteJSONMeasurements();

                    //PageLayout End
                    if (InspectByte() == 0x03)
                    {
                        w.WriteMember("PageLayoutEnd");
                        w.WriteStartObject();
                        WriteJSONPageProp();
                        w.WriteEndObject();
                    }

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
                    if (InspectByte() == 0x14)
                    {
                        //Advance over the the 0x14
                        Seek(1);
                        while (InspectByte() == 0x06)
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
                    if (InspectByte() == 0x01)
                    {
                        Seek(1);
                        w.WriteMember("PageLayoutStart");
                        w.WriteStartObject();
                        WriteJSONPageProp();
                        w.WriteEndObject();

                        //Write properties from page that belong on section
                        WriteTempProperty("ColumnSpacing");
                        WriteTempProperty("ColumnCount");

                    }

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
            majorVersion = ReadByte();
            w.WriteNumber(majorVersion);
            w.WriteMember("Minor");
            minorVersion = ReadByte();
            w.WriteNumber(minorVersion);
            w.WriteMember("Build");
            w.WriteNumber(ReadInt32());
            w.WriteEndObject();

        }
        private void WriteJSONArrayOffset()
        {
            int PageCount;

            if (ReadByte() == 0x12)
            {

                w.WriteMember("ArrayOffset");
                w.WriteStartObject();

                w.WriteMember("Offset");
                w.WriteNumber(ReadInt64());
                w.WriteMember("Count");
                PageCount = ReadInt32();
                w.WriteNumber(PageCount);
                w.WriteMember("PageContent");
                w.WriteStartArray();
                for (int i = 1; i < PageCount; i++)
                {
                    w.WriteNumber(ReadInt64());
                }
                w.WriteEndArray();
                w.WriteStartObject();
            }
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
            prop.Add("Columns", "Int32", 0x17,true);
            prop.Add("ColumnSpacing", "Single", 0x16, true);
            prop.Add("PageStyle", "Object", 0x06, this.WriteJSONStyle);

            prop.Write(this);

            if (ReadByte() != 0xFF)
                ThrowParseError();


        }
        private Boolean WriteJSONSections()
        {
            RPLProperties prop;

            w.WriteStartObject();

            //Section Properties
            if (InspectByte() == 0x16)
            {
                //Mixed Section
                prop = new RPLProperties(0x16);
                prop.Add("ID", "String", 0x00);
                prop.Add("ColumnCount", "Int32", 0x01);
                prop.Add("ColumnSpacing", "Single", 0x02);
                prop.Write(this);
            }
            else if (InspectByte() == 0x15)
            {
                //SimpleSection Section
                prop = new RPLProperties(0x15);
                prop.Add("ID", "String", 0x00);
                prop.Add("ColumnCount", "Int32", 0x01);
                prop.Add("ColumnSpacing", "Single", 0x02);
                prop.Write(this);
            }
            else
                ThrowParseError();

            //BodyArea
            w.WriteMember("Columns");
            w.WriteStartArray();
            if (InspectByte() == 0x14)
            {
                //Advance over the the 0x14
                Seek(1);
                while (InspectByte() == 0x06)
                {
                    WriteJSONBodyElement();
                }
               
            }

            w.WriteEndArray();
            //Report ElementEnd
            //WriteJSONReportElementEnd();
            w.WriteEndObject();

            return true;

        }
        private Boolean WriteJSONBodyElement()
        {
            if (InspectByte() == 0x06)
            {
                //Advance over the the 0x06
                Seek(1);

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
                ThrowParseError();

            return true;
        }
        private Boolean WriteJSONElements(byte ObjectType = 0x00, int DeRef = 0)
        {
            // ObjectType is used to handle dublicate values
            // 0x13 is Paragraph
            //0x14 TextRun

            //Def ref is used for share propoerties that need to be deferenced
            // 0 means normal
            // 1 mean Shared property only
            // 2 means non sharred only


            RPLProperties prop;

            if (DeRef != 2)
                if (ReadByte() != 0x0F)
                    // THis must be a Element Property
                    ThrowParseError();


            if (InspectByte() == 0x00 || (InspectByte() == 0x01 && DeRef == 2))
            {
                if (DeRef == 1 || DeRef == 0)
                {
                    //w.WriteMember("Elements");
                    w.WriteStartObject();
                    //Shared Properties
                    w.WriteMember("SharedElements");
                    w.WriteStartObject();
                    prop = new RPLProperties(0x00);
                    prop.Add("ID", "String", 0x01);
                    if (ObjectType != 0x14) prop.Add("Label", "String", 0x03);
                    else prop.Add("Label", "String", 0x08);
                    prop.Add("Name", "String", 0x02);
                    prop.Add("Bookmark", "String", 0x04);
                    prop.Add("Tooltip", "String", 0x05);
                    prop.Add("Style", "Object", 0x06, this.WriteJSONStyle);
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
                    prop.Write(this);
                    w.WriteEndObject();
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
                    prop.Add("Style", "Object", 0x06, this.WriteJSONStyle);
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
                    prop.Write(this);
                    w.WriteEndObject();
                    w.WriteEndObject();


                    if (ReadByte() != 0xFF)
                        //This should never happen
                        ThrowParseError();
                }


            }
            else if (InspectByte() == 0x02)
            {
                ReadByte();
                int NewIndex = (int)ReadInt64();
                int CurrIndex = this.Index;
                this.Index = NewIndex;
                WriteJSONElements(ObjectType, 1);
                this.Index = CurrIndex;
                WriteJSONElements(ObjectType, 2);
            }

            return true;

        }
        private Boolean WriteJSONImageDataProperties()
        {
            RPLProperties prop;

            
            // If this is a Style Property eat the header byte
            if (InspectByte() == 0x21)
                ReadByte();
                       
            if (ReadByte() != 0x2A)
                //This should never happen
                ThrowParseError();

            switch (ReadByte())
            {
                case 0x02:
                    //Shared Image so unshare
                    int NewIndex = (int)ReadInt64();
                    DeReference(NewIndex, WriteJSONImageDataProperties);
                    break;
                case 0x00:
                    //Inline
                    Seek(-1);
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
                    Seek(-1);
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
            w.WriteMember("Left");
            w.WriteNumber(ReadInt32());
            w.WriteMember("Top");
            w.WriteNumber(ReadInt32());
            w.WriteMember("Width");
            w.WriteNumber(ReadInt32());
            w.WriteMember("Height");
            w.WriteNumber(ReadInt32());

            return true;
        }
        private Boolean WriteJSONImageData()
        {
            int Count;
            w.WriteMember("Count");
            Count = ReadInt32();
            w.WriteNumber(Count);

            w.WriteMember("ImageContent");
            w.WriteStartArray();
            for (int i = 0; i < Count; i++)
                w.WriteNumber(ReadByte());
            w.WriteEndArray();
            return true;
        }
        private Boolean WriteJSONActionImageMapAreas()
        {
            int Count;

            if (ReadByte() != 0x26)
                //This should never happen
                ThrowParseError();

            w.WriteMember("Count");
            Count = ReadInt32();
            w.WriteNumber(Count);

            w.WriteMember("ActionInfoWithMaps");
            w.WriteStartArray();
            for (int i = 0; i < Count; i++)
            {
                if (ReadByte() != 0x07)
                    //This should never happen
                    ThrowParseError();

                w.WriteStartObject();
                if (InspectByte() == 0x02)
                    WriteJSONActionInfoContent();
                if (InspectByte() == 0x0A)
                    WriteJSONImageMapAreas();
                if (ReadByte() != 0xFF)
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
            RPLProperties prop;

            if (ReadByte() == 0x0A)
            {
                w.WriteMember("ImageMapAreas");
                w.WriteStartObject();
                w.WriteMember("Count");
                Count = ReadInt32();
                w.WriteNumber(Count);

                w.WriteMember("ImageMapArea");
                w.WriteStartArray();
                for (int i = 0; i < Count; i++)
                {
                    w.WriteStartObject();
                    w.WriteMember("ShapeType");
                    w.WriteNumber(ReadByte());
                    w.WriteMember("CoorCount");
                    CorCount = ReadInt32();
                    w.WriteNumber(CorCount);
                    w.WriteMember("Coordinates");
                    w.WriteStartArray();
                    for (int j = 0; j < CorCount; j++)
                        w.WriteNumber(ReadSingle());
                    w.WriteEndArray();
                    if (ReadByte() != 0xFF)
                    {
                        //This must be a tooltip
                        w.WriteMember("Tooltip");
                        w.WriteString(ReadString());
                    }
                    w.WriteEndObject();
                }
                w.WriteEndArray();
                w.WriteEndObject();
            }
            else
                //This cannot happen
                ThrowParseError();
        }
        private void WriteJSONActionInfoContent()
        {
            if (ReadByte() == 0x02)
                WriteJSONActions();
            else
                //This cannot happen
                ThrowParseError();

        }
        private Boolean WriteJSONActionInfo()
        {
            if (InspectByte() == 0x0B || InspectByte() == 0x07)
            {
                Seek(1);
                WriteJSONActionInfoContent();

                if (ReadByte() != 0xFF)
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
            Count = ReadInt32();
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
            if (ReadByte() != 0x10)
                ThrowParseError();  //This should never happen

            w.WriteMember("Measurement");
            w.WriteStartObject();
            w.WriteMember("Offset");
            w.WriteNumber(ReadInt64());
            w.WriteMember("Count");
            int Count = ReadInt32();
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
            w.WriteNumber(ReadSingle());
            w.WriteMember("Top");
            w.WriteNumber(ReadSingle());
            w.WriteMember("Width");
            w.WriteNumber(ReadSingle());
            w.WriteMember("Height");
            w.WriteNumber(ReadSingle());
            w.WriteMember("zIndex");
            w.WriteNumber(ReadInt32());
            w.WriteMember("State");
            w.WriteNumber(ReadByte());
            w.WriteMember("EndOffset");
            w.WriteNumber(ReadInt64());
            w.WriteEndObject();

        }
        private Boolean WriteJSONOrigionalValue(byte TypeCode)
        {

            switch (TypeCode)
            {
                case 0x03:
                    w.WriteBoolean(ReadBoolean());
                    break;
                case 0x04:
                    w.WriteString(ReadChar().ToString());
                    break;
                case 0x06:
                    w.WriteNumber(ReadByte());
                    break;
                case 0x07:
                    w.WriteNumber(ReadInt16());
                    break;
                case 0x09:
                    w.WriteNumber(ReadInt32());
                    break;
                case 0x0B:
                    w.WriteNumber(ReadInt64());
                    break;
                case 0x0C:
                    w.WriteNumber(ReadSingle());
                    break;
                case 0x0D:
                    w.WriteNumber(ReadFloat());
                    break;
                case 0x0E:
                    w.WriteNumber(ReadDecimal());
                    break;
                case 0x0F:
                    w.WriteNumber(ReadDateTime().MiliSec);
                    //TODO Need to write datetime type                        
                    break;
                case 0x11:
                default:
                    w.WriteString(ReadString());
                    break;
            }

            return true;
        }
        private Boolean WriteJSONReportItems()
        {

            //w.WriteMember("ReportItems");
            w.WriteStartArray();

            while (WriteJSONReportItem()) ;

            w.WriteEndArray();
            return true;

        }
        private Boolean WriteJSONReportItem(Boolean CheckOnly = false)
        {

            switch (InspectByte())
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
            if (ReadByte() != 0x0A)
                // THis must be a Measurment Property
                ThrowParseError();

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
            if (ReadByte() != 0x0D)
                // THis must be a Measurment Property
                ThrowParseError();

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
            while (InspectByte() == 0x12 || WriteJSONReportItem(true))
            {
                if (InspectByte() == 0x12)
                {
                    //Tablix Row
                    ReadByte();  //Read the Token
                    w.WriteStartObject();
                    w.WriteMember("Type");
                    w.WriteString("BodyRow");
                    w.WriteMember("RowIndex");
                    w.WriteNumber(ReadInt32());
                    //WriteCells
                    LoopObjectArray("Cells", 0x0D, this.WriteJSONCells);
                    //w.WriteEndObject();
                    if (ReadByte() != 0xFF)
                        //This should never happen
                        ThrowParseError();
                }
                else
                    WriteJSONReportItem();

            }

            w.WriteEndArray();
            w.SetShouldWrite(true);

            //Tablix Structure
            if (ReadByte() == 0x11)
            {
                w.WriteMember("TablixOffset");
                w.WriteNumber(ReadInt64());

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
                Seek(-1);
                LoopObjectArray("TablixRows", 0x08, this.WriteJSONTablixRow);
                if (ReadByte() != 0xFF)
                    //THis should never happen
                    ThrowParseError();
            }
            else
                //This should never happen
                ThrowParseError();

            WriteJSONReportElementEnd();
            w.WriteEndObject();

        }


        private Boolean WriteJSONDeRefCellReportItem()
        {
            if (ReadByte() != 0x04)
                // THis must be a Cell reference Property
                ThrowParseError();
            int StartIndex = (int)ReadInt64();
            int CurrIndex = this.Index;
            this.Index = StartIndex;


            if (ReadByte() != 0xFE)
                // THis must be a ReportElementEnd record
                ThrowParseError();
            //Jump to start of ReportItemEnd  This is differnt for each report item             
            this.Index = (int)ReadInt64();
            switch (InspectByte())
            {
                case 0x12:
                    //Rich textbox structure
                    ReadByte();
                    this.Index = (int)ReadInt64();
                    break;
                case 0x11:
                    //Tablix Structure
                    ReadByte();
                    this.Index = (int)ReadInt64();
                    break;
                case 0x10:
                    //Rectangle measurements
                    ReadByte();
                    this.Index = (int)ReadInt64();
                    break;
                default:
                    break;
            }
            w.WriteMember("ReportItem");
            WriteJSONReportItem();


            //Set back
            this.Index = CurrIndex;
            return true;

        }

        private void WriteJSONDeRefTablixBodyCells()
        {
            int StartIndex = (int)ReadInt64();
            int CurrIndex = this.Index;
            this.Index = StartIndex;


            if (ReadByte() != 0x12)
                // THis must be a Cell reference Property
                ThrowParseError();

            //Tablix Row
            w.WriteStartObject();
            w.WriteMember("Type");
            w.WriteString("BodyRow");
            w.WriteMember("RowIndex");
            w.WriteNumber(ReadInt32());
            //WriteCells
            LoopObjectArray("Cells", 0x0D, this.WriteJSONCells);
            w.WriteEndObject();
            if (ReadByte() != 0xFF)
                //This should never happen
                ThrowParseError();
            //Set back
            this.Index = CurrIndex;
        }

        private Boolean WriteJSONTablixRow()
        {
            RPLProperties prop;
            while (InspectByte() == 0x0A || InspectByte() == 0x0B || InspectByte() == 0x0C || InspectByte() == 0x09)
            {
                switch (InspectByte())
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
                        Seek(1);
                        WriteJSONDeRefTablixBodyCells();
                        break;
                    default:
                        ThrowParseError();
                        break;
                }

            }
            if (ReadByte() != 0xFF)
                //THis should never happen
                ThrowParseError();
            return true;
        }


        private Boolean WriteJSONTablixColMemeber()
        {
            int Count;
            if (ReadByte() != 0x0F)
                //THis should never happen
                ThrowParseError();

            w.WriteMember("ColMemberDefCount");
            Count = ReadInt32();
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

            if (ReadByte() != 0x10)
                //This should never happen
                ThrowParseError();

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

            if (ReadByte() != 0x0E)
                //THis should never happen
                ThrowParseError();

            w.WriteMember("RowMemberDefCount");
            Count = ReadInt32();
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

            if (ReadByte() != 0x04)
                //THis should never happen
                ThrowParseError();

            w.WriteMember("ColumnCount");
            Count = ReadInt32();
            w.WriteNumber(Count);

            w.WriteMember("Columns");
            w.WriteStartArray();
            for (int i = 0; i < Count; i++)
            {
                w.WriteStartObject();
                w.WriteMember("Width");
                w.WriteNumber(ReadSingle());
                w.WriteMember("FixColumn");
                w.WriteNumber(ReadByte());
                w.WriteEndObject();
            }
            w.WriteEndArray();

            return true;
        }
        private Boolean WriteJSONRowHeights()
        {
            int Count;

            if (ReadByte() != 0x05)
                //THis should never happen
                ThrowParseError();

            w.WriteMember("RowCount");
            Count = ReadInt32();
            w.WriteNumber(Count);

            w.WriteMember("Rows");
            w.WriteStartArray();
            for (int i = 0; i < Count; i++)
            {
                w.WriteStartObject();
                w.WriteMember("Height");
                w.WriteNumber(ReadSingle());
                w.WriteMember("FixRows");
                w.WriteNumber(ReadByte());
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
            if (ReadByte() != 0x07)
                ThrowParseError();  //This should never happen

            w.WriteStartObject();
            w.WriteMember("Type");
            w.WriteString("RichTextBox");

            //Properties
            w.WriteMember("Elements");
            WriteJSONElements();

            //Paragraphs
            w.WriteMember("Paragraphs");
            w.WriteStartArray();
            while (InspectByte() == 0x14)
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
            if (ReadByte() == 0x12)
            {

                w.WriteMember("TokenOffset");
                w.WriteNumber(ReadInt64());
                w.WriteMember("ParagraphCount");
                int ParCount = ReadInt32();
                w.WriteNumber(ParCount);
                w.WriteMember("ParagraphOffsets");
                w.WriteStartArray();
                for (int i = 0; i < ParCount; i++)
                    w.WriteNumber(ReadInt64());
                w.WriteEndArray();
                if (ReadByte() != 0xFF)
                    //THis should never happen
                    ThrowParseError();
            }
            else
                //THis should never happen
                ThrowParseError();
            w.WriteEndObject();

            WriteJSONReportElementEnd();
            w.WriteEndObject();

        }
        private Boolean WriteJSONParagraph()
        {
            if (ReadByte() == 0x13)
            {
                w.WriteMember("Paragraph");
                //WriteJSONElements();
                RPLProperties prop;

                if (ReadByte() != 0x0F)
                    ThrowParseError();

                switch (InspectByte())
                {
                    case 0x02:
                        //Shared Image so unshare
                        int NewIndex = (int)ReadInt64();
                        DeReference(NewIndex, this.WriteJSONParagraph);
                        break;
                    case 0x00:
                        //Shared Properties
                        w.WriteStartObject();
                        w.WriteMember("SharedElements");
                        w.WriteStartObject();
                        prop = new RPLProperties(0x00);
                        prop.Add("ID", "String", 0x05);
                        prop.Add("Style", "Object", 0x06, this.WriteJSONStyle);
                        prop.Add("ListStyle", "Byte", 0x07);
                        prop.Add("ListLevel", "Int32", 0x08);
                        prop.Add("LeftIndent", "String", 0x09);
                        prop.Add("RightIndent", "String", 0x0A);
                        prop.Add("HangingIndent", "String", 0x0B);
                        prop.Add("SpaceBefore", "String", 0x0C);
                        prop.Add("SpaceAfter", "String", 0x0D);
                        prop.Add("ContentHeight", "Single", 0x03);
                        prop.Write(this);
                        w.WriteEndObject();

                        //NonShared                     
                        if (InspectByte() == 0x01)
                        {
                            prop = new RPLProperties(0x01);
                            w.WriteMember("NonSharedElements");
                            w.WriteStartObject();
                            prop.Add("UniqueName", "String", 0x04);
                            prop.Add("Style", "Object", 0x06, this.WriteJSONStyle);
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
                        w.WriteEndObject();

                        if (ReadByte() != 0xFF)
                            //The end of ElementProperties
                            ThrowParseError();
                        break;
                }

                //TextRuns
                w.WriteMember("TextRunCount");
                int Count = ReadInt32();
                w.WriteNumber(Count);
                w.WriteMember("TextRunOffsets");
                w.WriteStartArray();
                for (int i = 0; i < Count; i++)
                    w.WriteNumber(ReadInt64());
                w.WriteEndArray();
                if (ReadByte() != 0xFF)
                    //THis should never happen
                    ThrowParseError();
            }
            else
                //THis should never happen
                ThrowParseError();

            return true;
        }
        private Boolean WriteJSONTextRun()
        {
            //Properties
            w.WriteStartObject();
            w.WriteMember("Elements");
            RPLProperties prop;

            if (ReadByte() != 0x0F)
                ThrowParseError();

            switch (InspectByte())
            {
                case 0x02:
                    //Shared Image so unshare
                    int NewIndex = (int)ReadInt64();
                    DeReference(NewIndex, WriteJSONTextRun);
                    break;
                case 0x00:
                    //Shared Properties
                    w.WriteStartObject();
                    w.WriteMember("SharedElements");
                    w.WriteStartObject();
                    prop = new RPLProperties(0x00);
                    prop.Add("ID", "String", 0x05);
                    prop.Add("Style", "Object", 0x06, this.WriteJSONStyle);
                    prop.Add("Markup", "Byte", 0x07);
                    prop.Add("Label", "String", 0x08);
                    prop.Add("Tooltip", "String", 0x09);
                    prop.Add("Value", "String", 0x0A);
                    prop.Add("Formula", "String", 0x0C);
                    prop.Add("ContentHeight", "Single", 0x03);
                    prop.Write(this);
                    w.WriteEndObject();

                    //NonShared                     
                    if (InspectByte() == 0x01)
                    {
                        prop = new RPLProperties(0x01);
                        w.WriteMember("NonSharedElements");
                        w.WriteStartObject();
                        prop.Add("UniqueName", "String", 0x04);
                        prop.Add("Markup", "Byte", 0x07);
                        prop.Add("Style", "Object", 0x06, this.WriteJSONStyle);
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
                    w.WriteEndObject();

                    if (ReadByte() != 0xFF)
                        //The end of ElementProperties
                        ThrowParseError();
                    break;
            }

            if (ReadByte() != 0xFF)
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
            if (ReadByte() != type)
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
            if (ReadByte() != 0x0C)
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
            if (ReadByte() != 0x08)
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
            if (ReadByte() == 0xFE)
            {
                w.WriteMember("OffsetRef");
                w.WriteNumber(ReadInt64());
            }
            else
                //TODO Throw correct, this should not happen
                throw new IndexOutOfRangeException();

            //Must be the end
            if (ReadByte() != 0xFF)
                //TODO Throw correct, this should not happen
                throw new IndexOutOfRangeException();

        }
        private Boolean WriteJSONStyle()
        {
            if (ReadByte() != 0x06)
                //TODO Throw correct, this should not happen
                throw new IndexOutOfRangeException();
            RPLProperties prop;

            if (InspectByte() == 0x00)
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
            prop.Add("BackgroundImage", "Object", 0x21,WriteJSONImageDataProperties);
            prop.Add("BackgroundColor", "String", 0x22);
            prop.Add("BackgroundRepeat", "Byte", 0x23);
            prop.Add("NumeralLanguage", "String", 0x24);
            prop.Add("NumeralVariant", "Int32", 0x25);
            prop.Add("Calendar", "Byte", 0x26);

            prop.Write(this);
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

        private int ReadInt32()
        {
            int retval = BitConverter.ToInt32(RPL, Index);
            Seek(4);
            return retval;
        }
        private Int64 ReadInt64()
        {
            Int64 retval = BitConverter.ToInt64(RPL, Index);
            Seek(8);
            return retval;
        }
        private RPLDateTime ReadDateTime()
        {
            RPLDateTime retval = new RPLDateTime();
            Int64 dt = RPL[Index]; ;
            byte b = RPL[Index];

            retval.Type = b >> 2;
            retval.MiliSec = dt << 2;
            Seek(8);
            return retval;
        }
        private short ReadInt16()
        {
            short retval = BitConverter.ToInt16(RPL, Index);
            Seek(2);
            return retval;
        }
        private float ReadSingle()
        {
            float retval = BitConverter.ToSingle(RPL, Index);
            Seek(4);
            return retval;
        }
        private double ReadFloat()
        {
            double retval = BitConverter.ToDouble(RPL, Index);
            Seek(8);
            return retval;
        }
        private char ReadChar()
        {
            char retval = Encoding.Unicode.GetChars(RPL, Index, 2)[1];
            Seek(2);
            return retval;
        }
        private byte ReadByte()
        {
            byte retval = RPL[Index];
            Seek(1);
            return retval;
        }
        private byte InspectByte()
        {
            byte retval = RPL[Index];
            return retval;
        }
        private decimal ReadDecimal()
        {
            int[] bits = new int[4];
            bits[0] = ReadInt32();
            bits[2] = ReadInt32();
            bits[3] = ReadInt32();
            bits[4] = ReadInt32();

            decimal retval = new decimal(bits);
            return retval;
        }
        private Boolean ReadBoolean()
        {
            Boolean retval;

            if (RPL[Index] == 1)
                retval = true;
            else
                retval = false;
            Seek(1);
            return retval;
        }
        private string ReadString()
        {
            int length;
            string retval;

            length = GetLength(0);
            retval = Encoding.Unicode.GetString(RPL, Index, length);
            Seek(length);
            return retval;

        }
        private int GetLength(int Depth)
        {
            int Len;
            int retval;

            Len = ReadByte();
            if (Len > 128)
            {
                retval = Len - 128;
                retval += GetLength(Depth + 1) * (Depth + 1) * 128;
            }
            else
                retval = Len;

            return retval;

        }
        private void Seek(int Advance)
        {
            Index += Advance;
        }

    }

    public static class JsonUtility
    {
        public static ParameterValue[] GetParameterValue(string parameterList)
        {
            List<ParameterValue> list = new List<ParameterValue>();

            using (JsonTextReader reader = new JsonTextReader(new StringReader(parameterList)))
            {
                JsonObject jsonObj = new JsonObject();
                jsonObj.Import(reader);

                JsonArray parameterArray = jsonObj["ParamsList"] as JsonArray;

                foreach (JsonObject obj in parameterArray)
                {
                    if (obj["IsMultiple"].ToString() == "True")
                    {
                        string temp = obj["Value"].ToString();
                        foreach (string str in temp.Split(','))
                        {
                            ParameterValue pv = new ParameterValue();
                            pv.Name = obj["Parameter"].ToString();
                            pv.Value = str;
                            list.Add(pv);
                        }

                    }
                    else
                    {
                        ParameterValue pv = new ParameterValue();
                        pv.Name = obj["Parameter"].ToString();
                        pv.Value = obj["Value"].ToString().ToLower() == "null" ? null : obj["Value"].ToString();
                        list.Add(pv);
                    }
                }

                return list.ToArray();
            }
        }
    }
}
