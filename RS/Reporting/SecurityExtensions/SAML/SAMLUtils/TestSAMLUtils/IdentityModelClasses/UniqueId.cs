using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace TestSAMLUtils
{
public static class UniqueId
{
    // Fields
    private static readonly string _optimizedNcNamePrefix = ("_" + _reusableUuid + "-");
    private static readonly string _reusableUuid = GetRandomUuid();
    private const string NcNamePrefix = "_";
    private const int RandomSaltSize = 0x10;
    private const string UuidUriPrefix = "urn:uuid:";

    // Methods
    public static string CreateRandomId()
    {
        return ("_" + GetRandomUuid());
    }

    public static string CreateRandomId(string prefix)
    {
        if (string.IsNullOrEmpty(prefix))
        {
            throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgumentNull("prefix");
        }
        return (prefix + GetRandomUuid());
    }

    public static string CreateRandomUri()
    {
        return ("urn:uuid:" + GetRandomUuid());
    }

    public static string CreateUniqueId()
    {
        return (_optimizedNcNamePrefix + GetNextId());
    }

    public static string CreateUniqueId(string prefix)
    {
        if (string.IsNullOrEmpty(prefix))
        {
            throw new Exception("prefix is null");
            //throw DiagnosticUtility.ExceptionUtility.ThrowHelperArgumentNull("prefix");
        }
        return (prefix + _reusableUuid + "-" + GetNextId());
    }

    private static string GetNextId()
    {
        /*
        RandomNumberGenerator generator = RandomNumberGenerator.Create();
        byte[] data = new byte[0x10];
        generator.GetBytes(data);
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < data.Length; i++)
        {
            builder.AppendFormat("{0:X2}", data[i]);
        }
        return builder.ToString();
        */
        return "";
    }

    private static string GetRandomUuid()
    {
        return Guid.NewGuid().ToString("D", CultureInfo.InvariantCulture);
    }
}
}
