using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using ForerunnerRegister;
using System.Xml;
using System.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;
using System.IO;

namespace ForerunnerWebService
{

    public class License
    {
        public string Response = "<LicenseResponse><Status>{0}</Status><StatusCode>{1}</StatusCode><Value>{2}</Value></LicenseResponse>";
        public string LicenseKey = null;
        public string MachineKey = null;
        public string Action = null;
        public int Status = 0;
        public string StoredMachineKey = null;
        public string ActivatePackage = null;
        public DateTime LastActivation;
        public DateTime FirstActivationDate;
        public int Quantity;
        public string SKU = null;

        private string pkey = @"<RSAKeyValue><Modulus>oqauZZXXShzB2xxb2643zxDbWyFjcW1uihkGt/dNhrwRbdRm1f43v4+8y7GMwhigVuYaVBVcwGdeDBePoKsqsQ71IE+sarxpmVibPKLfhsMF9Yvj8o6uy5BsUhViK76kpswIhjj32XXtYTIuBhlxtv1Oo0w4yDgIMXExJiSp9+1AW6hvUiL7CCJAPuuPIqd9ZCD/KPOOZecj2qxpIEOgTU9/kSO2QOJA4Soup/DPj/brWYsFtHzKP2RRzZzPFbKn7uy9TR+ws+sGpvnGIT7dCyN3K0S5Lm6c8u6Fg1ePrBg8jyhpgK7raUhkn7TKnuauU+vQdz8zFx5ZawTvZORxJQ==</Modulus><Exponent>AQAB</Exponent></RSAKeyValue>";
        private string pubkey = @"<RSAKeyValue><Modulus>oqauZZXXShzB2xxb2643zxDbWyFjcW1uihkGt/dNhrwRbdRm1f43v4+8y7GMwhigVuYaVBVcwGdeDBePoKsqsQ71IE+sarxpmVibPKLfhsMF9Yvj8o6uy5BsUhViK76kpswIhjj32XXtYTIuBhlxtv1Oo0w4yDgIMXExJiSp9+1AW6hvUiL7CCJAPuuPIqd9ZCD/KPOOZecj2qxpIEOgTU9/kSO2QOJA4Soup/DPj/brWYsFtHzKP2RRzZzPFbKn7uy9TR+ws+sGpvnGIT7dCyN3K0S5Lm6c8u6Fg1ePrBg8jyhpgK7raUhkn7TKnuauU+vQdz8zFx5ZawTvZORxJQ==</Modulus><Exponent>AQAB</Exponent><P>0Q0LzatBMP22CQSOTdSScU/s0CgSlr5iWBluuwDMBDljLonC20ges1BFwzoQuTITWmFfG9eDAEMtCU+jIkS5pImg+ysDEAnyHzSXbLSNqpTISnClz5X+LZ6dy8eCITWk6bD1rJPCBQ0p10HMSku8LXVLzSumNf63L/PjOMrV7ns=</P><Q>xy34gJOxaVtFaTXPnClXZuUDUjMLXGHoSqKrThki94HA2PtLexvvyUopSGB99HYUi5ZXzWhegqifu83MNoOiiG373MD3q9EhjVl3bVEL/hXrz024svKChmg9JgnSBIQQj5Ap16r67DcDJPuUD5Syt7KvSMAFT4CjN6rhzYtI3N8=</Q><DP>Sbq6MP13bpnsu915ewW/6Grx8LBRbg0TjlLZ9OZhDhRXYLCBoukaus9S63ntMAPzQ2sYKi+mKk+G8MO/m3R1rQxFVJBk8iEv3cWkqlg7pq/2vBpiwIX8MYbBzH8+7AuJcEpTO1yZj0KHQT4ZmRKA+d9mrqP4aQ6++RChUQRo00U=</DP><DQ>QFiFk2QjSFoIDnkn3NcuOTt62y9KWEn49UOf+9b7COKOHorwU5Eu4eRnec5SYotTD9U+AEnbXnKDR/SwKFxWQaTmXOaqHIOvRy7D+jjYmvkR+SKurIDT0gAS4RsDEhpoDzkPi3DdJzqOdYAg0PfE1LuRDPubu5dfIzi9Qd3haBk=</DQ><InverseQ>M1+6GRJ4eQGkekE5F/NsJjUhcxkfoHvIJ8vMycR8tKLjorSsLcB3bB4pj5HVGdSDbHH7+veST0vIB89lZpa7MW9pwdOZVVG9IAD0If+6FLRAvPztOlWplSvfH/XX2fCXYoolf7MYC7vC0TGnA4cBJJonE8pk70JjIi4THdvUU9c=</InverseQ><D>RVdBBy7bww1Ceep7oMqDoWPC2HWCAxPPqdEkg55LL1MTLRr9omJIGwMozkAJzZ+ZD6L2e31F9wK6XfZXdXwzbZt+VkGRNEnRzR2wxKd9GuMescFrMvewPjl6bH4QRaz3XeKjCbHUvCEhy6uMYm5Lg+M2uLhghr8YgxeKCAReb8LIAO5n6VnZBiLJdrh6PJEbEGTI5XmYwhMIGuP1Sw2fwW8FtUURgr/HMA5M0cJRyRUBauT2IqImRNVZlaw0AKGLN88Yb5NFTQJ2NyRD9z81dp1Tm38Dsjacc7Se5Se+baa8M5LoRfZmmZY3KKBuFk1T9scgiCuzuH1BIr3mWjVZyw==</D></RSAKeyValue>";

        private void Load(string Request)
        {
            XmlReader XMLReq = XmlReader.Create(new StringReader(Request));            
            XMLReq.Read();
            if (XMLReq.Name != "LicenseRequest")
            {
                Response = String.Format(Response, "Fail", "1", "Not an License Request");
                Status = 1;
            }

            XMLReq.Read();
            while (!XMLReq.EOF)
            {
                if (XMLReq.NodeType != XmlNodeType.EndElement)
                {
                    switch (XMLReq.Name)
                    {
                        case "Action":
                            Action = XMLReq.ReadElementContentAsString();
                            break;
                        case "LicenseKey":
                            LicenseKey = XMLReq.ReadElementContentAsString();
                            break;
                        case "MachineKey":
                            MachineKey = XMLReq.ReadElementContentAsString();
                            break;
                        default:
                            Response = String.Format(Response, "Fail", "2", "Invalid License Request");
                            Status = 2;
                            break;

                    }                    
                }
                else
                    XMLReq.Read();
            }
        }
        public string ProcessRequest(string Request)
        {
            Load(Request);
            if (Status != 0)
                return Response;

            switch (Action)
            {
                case "Activate":
                    return ProcessActivate();
                case "Validate":
                    return ProcessValidate();
                case "DeActivate":
                    return ProcessDeActivate();
            }

            return String.Format(Response, "Fail", "2", "Invalid License Request");
        }

        private string GetActivatePackage()
        {
            string value = "<License><SKU>{0}</SKU><Quantity>{1}</Quantity><MachineKey>{2}</MachineKey><LicenseKey>{3}</LicenseKey><License>";
            return EncryptUsingPrivate(string.Format(value, SKU, Quantity, MachineKey,LicenseKey));
        }

        private string ProcessActivate()
        {
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();
            SqlDataReader SQLReader;
            bool success = false;

            string SQL = @"UPDATE License Set ActivationAttempts = ActivationAttempts+1 WHERE LicenseID = @LicenseID
                           SELECT MachineKey,LastActivateDate,Quantity,SKU,FirstActivationDate FROM License WHERE LicenseID = @LicenseID";
           try
            {
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.Parameters.AddWithValue("@LicenseID", LicenseKey);

                SQLReader = SQLComm.ExecuteReader();
                while (SQLReader.Read())
                {
                    if (!SQLReader.IsDBNull(0))
                        StoredMachineKey = SQLReader.GetString(0);
                    if (!SQLReader.IsDBNull(1))
                        LastActivation = SQLReader.GetDateTime(1);
                    Quantity  = SQLReader.GetInt32(2);
                    SKU = SQLReader.GetString(3);
                    if (!SQLReader.IsDBNull(4))
                        FirstActivationDate = SQLReader.GetDateTime(4);
                }
                SQLReader.Close();
                SQLConn.Close();
                if (MachineKey == null)
                    Response = String.Format(Response, "Fail", "100", "Invalid License Key");
                else
                {
                    if (StoredMachineKey == null)
                    {
                        Response = String.Format(Response, "Success", "0", GetActivatePackage());
                        success = true;
                    }                    
                    else
                    {
                        TimeSpan ts = DateTime.Now - FirstActivationDate;
                        if ((StoredMachineKey == MachineKey) && ((SKU == "MobSA1Year" || SKU == "MobSA1YearEx" || SKU == "Mob1YearSub") && ts.TotalDays < 365) || (SKU == "MobSA3Year" && ts.TotalDays < 365 * 3))
                        {
                            Response = String.Format(Response, "Success", "0", GetActivatePackage());
                            success = true;
                        }
                        else
                        {
                            ts = DateTime.Now - LastActivation;
                            if (ts.TotalDays < 30)
                                Response = String.Format(Response, "Fail", "101", "Already Activated");
                            else
                            {
                                Response = String.Format(Response, "Success", "0", GetActivatePackage());
                                success = true;
                            }
                        }
                    }
                }
                if (success)
                {
                    SQLConn.Open();
                    SQL = @"UPDATE LICENSE SET MachineKey = @MachineKey, LastActivateDate = GETDATE(), FirstActivationDate = CASE WHEN FirstActivationDate IS NULL THEN GetDATE() ELSE FirstActivationDate END WHERE LicenseID = @LicenseID";
                    SQLComm = new SqlCommand(SQL, SQLConn);
                    SQLComm.Parameters.AddWithValue("@LicenseID", LicenseKey);
                    SQLComm.Parameters.AddWithValue("@MachineKey", MachineKey);
                    SQLComm.ExecuteNonQuery();
                    SQLConn.Close();
                }
               
            }
            catch (Exception e)
            {
                SQLConn.Close();
                Response =  String.Format(Response, "Fail", "3", "Server Error");
            }

            return Response;
        }
        private string ProcessDeActivate()
        {
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();
            
            string SQL = @"UPDATE License SET MachineKey = null WHERE LicenseID = @LicenseID AND MachineKey = @MachineKey";

            try
            {
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.Parameters.AddWithValue("@LicenseID", LicenseKey);
                SQLComm.Parameters.AddWithValue("@MachineKey", MachineKey);
                int rows = SQLComm.ExecuteNonQuery();
                SQLConn.Close();
                if (rows == 0)
                    Response = String.Format(Response, "Fail", "105", "Invalid LicenseKey or MachineKey");
                else
                    Response = String.Format(Response, "Success", "0", "");
            }
            catch (Exception e)
            {
                SQLConn.Close();
                Response = String.Format(Response, "Fail", "3", "Server Error");
            }
            return Response;

        }
        private string ProcessValidate()
        {
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();
            SqlDataReader SQLReader;

            string SQL = @"SELECT MachineKey,LastActivateDate,Quantity,SKU,FirstActivationDate FROM License WHERE LicenseID = @LicenseID AND MachineKey = @MachineKey";

            try
            {
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.Parameters.AddWithValue("@LicenseID", LicenseKey);
                SQLComm.Parameters.AddWithValue("@MachineKey", MachineKey);
                
                SQLReader = SQLComm.ExecuteReader();
                while (SQLReader.Read())
                {
                    if (!SQLReader.IsDBNull(0))
                        StoredMachineKey = SQLReader.GetString(0);
                    if (!SQLReader.IsDBNull(1))
                        LastActivation = SQLReader.GetDateTime(1);
                    Quantity = SQLReader.GetInt32(2);
                    SKU = SQLReader.GetString(3);
                    if (!SQLReader.IsDBNull(4))
                        FirstActivationDate = SQLReader.GetDateTime(4);
                }
                SQLReader.Close();
                SQLConn.Close();


                if (StoredMachineKey == null)
                    Response = String.Format(Response, "Fail", "105", "Invalid LicenseKey or MachineKey");
                else
                {
                    TimeSpan ts = DateTime.Now - FirstActivationDate;
                    if ((SKU == "Mob1YearSub" && ts.TotalDays > 365) || (SKU == "MobTrial1MonthSub" && ts.TotalDays > 30) )
                        Response = String.Format(Response, "Fail", "200", "Suscription Expired");
                    else
                        Response = String.Format(Response, "Success", "0", "");
                }
            }
            catch (Exception e)
            {
                SQLConn.Close();
                Response = String.Format(Response, "Fail", "3", "Server Error");
            }
            return Response;
        }

        public string DecryptUsingPublic(string dataEncryptedBase64)
        {
            try
            {

                RSACryptoServiceProvider rsa = new RSACryptoServiceProvider();
                rsa.FromXmlString(pubkey);

                byte[] bytes = Convert.FromBase64String(dataEncryptedBase64);
                byte[] decryptedBytes = rsa.Decrypt(bytes, false);

                return Encoding.UTF8.GetString(decryptedBytes);
            }
            catch
            {
                return null;
            }
        }
        private string EncryptUsingPrivate(string DataToEncrypt)
        {
            try
            {

                RSACryptoServiceProvider rsa = new RSACryptoServiceProvider();
                rsa.FromXmlString(pkey);

                byte[] bytes = Encoding.UTF8.GetBytes(DataToEncrypt);
                byte[] EncryptedBytes = rsa.Encrypt(bytes, false);                              

                // I assume here that the decrypted data is intended to be a
                // human-readable string, and that it was UTF8 encoded.
                return Convert.ToBase64String(EncryptedBytes);
            }
            catch
            {
                return null;
            }
        }
    }
}