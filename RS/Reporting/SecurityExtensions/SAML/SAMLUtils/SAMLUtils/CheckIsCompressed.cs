using System;
using System.Collections.Generic;
using System.Text;

namespace ForeRunner.Reporting.Extensions.SAMLUtils
{
    public class CheckIsCompressed
    {
        public static bool IsGZip(byte[] bytes)
        {
            if (bytes.Length < 3)
                return false;
            return bytes[0] == 0x1F && bytes[1] == 0x8B && bytes[2] == 0x08;
        }
    }
}
