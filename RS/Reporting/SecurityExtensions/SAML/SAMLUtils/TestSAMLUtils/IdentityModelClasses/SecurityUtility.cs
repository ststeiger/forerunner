using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TestSAMLUtils
{
internal static class SecurityUtils
{
    public const string AuthTypeAnonymous = "";
    public const string AuthTypeBasic = "Basic";
    public const string AuthTypeCertMap = "SSL/PCT";
    public const string AuthTypeKerberos = "Kerberos";
    public const string AuthTypeNegotiate = "Negotiate";
    public const string AuthTypeNTLM = "NTLM";
    private static int fipsAlgorithmPolicy = -1;
    private const string fipsPolicyRegistryKey = @"System\CurrentControlSet\Control\Lsa";
    public const string Identities = "Identities";
    public const int WindowsVistaMajorNumber = 6;

   
    internal static byte[] CloneBuffer(byte[] buffer)
    {
        return CloneBuffer(buffer, 0, buffer.Length);
    }

    internal static byte[] CloneBuffer(byte[] buffer, int offset, int len)
    {
        byte[] dst = new byte[len];
        Buffer.BlockCopy(buffer, offset, dst, 0, len);
        return dst;
    }

    internal static bool MatchesBuffer(byte[] src, byte[] dst)
    {
        return MatchesBuffer(src, 0, dst, 0);
    }

    internal static bool MatchesBuffer(byte[] src, int srcOffset, byte[] dst, int dstOffset)
    {
        if ((dstOffset < 0) || (srcOffset < 0))
        {
            return false;
        }
        if ((src == null) || (srcOffset >= src.Length))
        {
            return false;
        }
        if ((dst == null) || (dstOffset >= dst.Length))
        {
            return false;
        }
        if ((src.Length - srcOffset) != (dst.Length - dstOffset))
        {
            return false;
        }
        int index = srcOffset;
        for (int i = dstOffset; index < src.Length; i++)
        {
            if (src[index] != dst[i])
            {
                return false;
            }
            index++;
        }
        return true;
    }
}
}
