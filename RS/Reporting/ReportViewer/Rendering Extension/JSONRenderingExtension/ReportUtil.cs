using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Reflection;
using System.Linq;
using System.Text;
using System.IO;
using Jayrock.Json;


namespace Forerunner
{
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
                retval += GetLength(Depth + 1) * (Depth + 1) * 128;
            }
            else
                retval = Len;

            return retval;

        }

    }

    public static class JsonUtility
    {
       
        public static string WriteExceptionJSON(Exception e)
        {
            JsonWriter w = new JsonTextWriter();
            w.WriteStartObject();
            w.WriteMember("Exception");
            w.WriteStartObject();
            w.WriteMember("Type");
            w.WriteString(e.GetType().ToString());
            w.WriteMember("TargetSite");
            w.WriteString(e.TargetSite.ToString());
            w.WriteMember("Source");
            w.WriteString(e.Source);
            w.WriteMember("Message");
            w.WriteString(e.Message);
            w.WriteMember("StackTrace");
            w.WriteString(e.StackTrace);
            w.WriteEndObject();
            w.WriteEndObject();

            return w.ToString();
        }
    }
}
