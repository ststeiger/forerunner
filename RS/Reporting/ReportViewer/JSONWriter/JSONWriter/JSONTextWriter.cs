using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Forerunner.JSONWriter
{
    public class JSONTextWriter
    {
        private StringBuilder buffer = new StringBuilder(256);
        private int shouldWrite = 0;

        private void RemoveComma()
        {
            if (shouldWrite >= 0)
            {
                if (buffer[buffer.Length - 1] == ',')
                    buffer.Remove(buffer.Length - 1, 1);
            }
        }

        public StringBuilder GetStringBuilder()
        {
            return buffer;

        }
        public void Insert(int Index,String Value)
        {
            if (shouldWrite >= 0)
                buffer.Insert(Index, Value);
        }

        public void Insert(int Index, JSONTextWriter Value)
        {
            if (shouldWrite >= 0)
                buffer.Insert(Index, Value);
        }

        public void Write(String Value)
        {
            if (shouldWrite >= 0)
                Append(Value, false, false);
        }

        public void Write(JSONTextWriter Value)
        {
            if (shouldWrite >= 0)
                buffer.Append(Value.buffer);
        }

        private void Append(string Value, bool AddQuotes = false, bool AddComma = true)
        {
            if (shouldWrite >= 0)
            {
                if (AddQuotes)
                    buffer.Append("\"");
                buffer.Append(Value);
                if (AddQuotes)
                    buffer.Append("\"");
                if (AddComma)
                    buffer.Append(",");
            }
        }

        public void Close()
        {
            buffer = new StringBuilder(256);
        }
        public void WriteNull()
        {
            Append("null");
            
        }
        public void WriteMember(string Name)
        {
            Append(Name,true,false);
            Append(":",false,false);
        }
        public void WriteNumber(Int16 Value)
        {
           Append(Value.ToString());
        }
        public void WriteNumber(Int32 Value)
        {
           Append(Value.ToString());
        }
        public void WriteNumber(Int64 Value)
        {
            Append(Value.ToString());
        }
        public void WriteNumber(Double Value)
        {
           Append(Value.ToString());
        }
        public void WriteNumber(Single Value)
        {
           Append(Value.ToString());
        }
        public void WriteNumber(Decimal Value)
        {
           Append(Value.ToString());
        }
        public void WriteNumber(byte Value)
        {
           Append(Value.ToString());
        }

        public void WriteJSON(string Value)
        {
            Append(Value);
        }
        public void WriteString(string Value)
        {
            string NewVal = "";
            if (Value != null)
            {
                NewVal = Value.Replace("\\", "\\\\");
                NewVal = NewVal.Replace("\"", "\\\"");
            }
           Append(NewVal, true);
            
        }
        public void WriteBoolean(Boolean Value)
        {
            if (Value)
                Append("true");
            else
                Append("false");
            
        }
        public void WriteStartObject()
        {
            Append("{", false, false);
        }
        public void WriteEndObject()
        {
            RemoveComma();
            Append("}");
        }
        public void SetShouldWrite(Boolean Value)
        {
            if (Value)
                shouldWrite++;
            else
                shouldWrite--;
        }
        public void WriteStartArray()
        {
            Append("[", false, false);
        }
        public void WriteEndArray()
        {
            RemoveComma();
            Append("]");
        }

        public void WriteStringArray(string[] Values)
        {
            WriteStartArray();
            foreach (string s in Values)
            {
                WriteString(s);
            }
            WriteEndArray();
        }
        
        public override String ToString()
        {
            RemoveComma();
            return buffer.ToString();
        }

    }
}
