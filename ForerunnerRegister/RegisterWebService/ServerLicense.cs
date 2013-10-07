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
using System.Collections;
using ForerunnerWebService;

namespace ForerunnerLicense
{

    public class ServerLicense
    {
        string Response = "<LicenseResponse><Status>{0}</Status><StatusCode>{1}</StatusCode><Value>{2}</Value></LicenseResponse>";
        public string NewLicenseKey = null;
        internal MachineId NewMachineData = null;
        public string Action = null;
        public int Status = 0;
        public string ActivatePackage = null;

        private string pkey = @"<RSAKeyValue><Modulus>oqauZZXXShzB2xxb2643zxDbWyFjcW1uihkGt/dNhrwRbdRm1f43v4+8y7GMwhigVuYaVBVcwGdeDBePoKsqsQ71IE+sarxpmVibPKLfhsMF9Yvj8o6uy5BsUhViK76kpswIhjj32XXtYTIuBhlxtv1Oo0w4yDgIMXExJiSp9+1AW6hvUiL7CCJAPuuPIqd9ZCD/KPOOZecj2qxpIEOgTU9/kSO2QOJA4Soup/DPj/brWYsFtHzKP2RRzZzPFbKn7uy9TR+ws+sGpvnGIT7dCyN3K0S5Lm6c8u6Fg1ePrBg8jyhpgK7raUhkn7TKnuauU+vQdz8zFx5ZawTvZORxJQ==</Modulus><Exponent>AQAB</Exponent><P>0Q0LzatBMP22CQSOTdSScU/s0CgSlr5iWBluuwDMBDljLonC20ges1BFwzoQuTITWmFfG9eDAEMtCU+jIkS5pImg+ysDEAnyHzSXbLSNqpTISnClz5X+LZ6dy8eCITWk6bD1rJPCBQ0p10HMSku8LXVLzSumNf63L/PjOMrV7ns=</P><Q>xy34gJOxaVtFaTXPnClXZuUDUjMLXGHoSqKrThki94HA2PtLexvvyUopSGB99HYUi5ZXzWhegqifu83MNoOiiG373MD3q9EhjVl3bVEL/hXrz024svKChmg9JgnSBIQQj5Ap16r67DcDJPuUD5Syt7KvSMAFT4CjN6rhzYtI3N8=</Q><DP>Sbq6MP13bpnsu915ewW/6Grx8LBRbg0TjlLZ9OZhDhRXYLCBoukaus9S63ntMAPzQ2sYKi+mKk+G8MO/m3R1rQxFVJBk8iEv3cWkqlg7pq/2vBpiwIX8MYbBzH8+7AuJcEpTO1yZj0KHQT4ZmRKA+d9mrqP4aQ6++RChUQRo00U=</DP><DQ>QFiFk2QjSFoIDnkn3NcuOTt62y9KWEn49UOf+9b7COKOHorwU5Eu4eRnec5SYotTD9U+AEnbXnKDR/SwKFxWQaTmXOaqHIOvRy7D+jjYmvkR+SKurIDT0gAS4RsDEhpoDzkPi3DdJzqOdYAg0PfE1LuRDPubu5dfIzi9Qd3haBk=</DQ><InverseQ>M1+6GRJ4eQGkekE5F/NsJjUhcxkfoHvIJ8vMycR8tKLjorSsLcB3bB4pj5HVGdSDbHH7+veST0vIB89lZpa7MW9pwdOZVVG9IAD0If+6FLRAvPztOlWplSvfH/XX2fCXYoolf7MYC7vC0TGnA4cBJJonE8pk70JjIi4THdvUU9c=</InverseQ><D>RVdBBy7bww1Ceep7oMqDoWPC2HWCAxPPqdEkg55LL1MTLRr9omJIGwMozkAJzZ+ZD6L2e31F9wK6XfZXdXwzbZt+VkGRNEnRzR2wxKd9GuMescFrMvewPjl6bH4QRaz3XeKjCbHUvCEhy6uMYm5Lg+M2uLhghr8YgxeKCAReb8LIAO5n6VnZBiLJdrh6PJEbEGTI5XmYwhMIGuP1Sw2fwW8FtUURgr/HMA5M0cJRyRUBauT2IqImRNVZlaw0AKGLN88Yb5NFTQJ2NyRD9z81dp1Tm38Dsjacc7Se5Se+baa8M5LoRfZmmZY3KKBuFk1T9scgiCuzuH1BIr3mWjVZyw==</D></RSAKeyValue>";
        LicenseData OldLD = new LicenseData();

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
                            NewLicenseKey = XMLReq.ReadElementContentAsString();
                            break;
                        case "MachineData":                            
                            NewMachineData = new MachineId(XMLReq);
                            break;
                        case "LicenseData":
                            UnPackLicenseData(XMLReq.ReadInnerXml());
                            break;
                    }                    
                }
                else
                    XMLReq.Read();
            }
        }
    
        private void UnPackLicenseData(string LicenseData)
        {
            try
            {
                if (LicenseData != "")
                    OldLD.LoadLicenseData(LicenseUtil.Verify(LicenseData, LicenseUtil.pubkey));
                Status = 0;
            }
            catch
            {
                Response = String.Format(Response, "Fail", "5", "Not Valid License Data");
                Status = 1;            
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

        private string GetActivatePackage(LicenseData ld)
        {
            string value = "<License><SKU>{0}</SKU><Quantity>{1}</Quantity>{2}<LicenseKey>{3}</LicenseKey><RequireValidation>{4}</RequireValidation><ActivationDate>{5}</ActivationDate><LicenseDuration>{6}</LicenseDuration></License>";
            return LicenseUtil.Sign(string.Format(value, ld.SKU, ld.Quantity, ld.MachineData.Serialize(false), ld.LicenseKey, ld.RequireValidation, ld.FirstActivationDate, ld.LicenseDuration), pkey);
        }

        private string ProcessActivate()
        {
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();
            SqlDataReader SQLReader;
            bool success = false;
            LicenseData NewLD = null;
            TimeSpan ts;

            
                    
            string SQL = @"UPDATE License Set ActivationAttempts = ActivationAttempts+1 WHERE LicenseID = @LicenseID
                           SELECT MachineData,LastActivateDate,Quantity,l.SKU,FirstActivationDate,IsSubscription,s.Duration,RequireValidation,IsTrial FROM License l INNER JOIN SKU s ON l.SKU = s.SKU  WHERE LicenseID = @LicenseID";
           try
            {
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.Parameters.AddWithValue("@LicenseID", NewLicenseKey);

                SQLReader = SQLComm.ExecuteReader();
                while (SQLReader.Read())
                {
                    NewLD = new LicenseData();
                    NewLD.LicenseKey = NewLicenseKey;
                    if (!SQLReader.IsDBNull(0))
                        NewLD.MachineData = new MachineId(SQLReader.GetString(0));
                    if (!SQLReader.IsDBNull(1))
                        NewLD.LastActivation = SQLReader.GetDateTime(1);
                    NewLD.Quantity = SQLReader.GetInt32(2);
                    NewLD.SKU = SQLReader.GetString(3);
                    if (!SQLReader.IsDBNull(4))
                        NewLD.FirstActivationDate = SQLReader.GetDateTime(4);
                    NewLD.IsSubscription = SQLReader.GetInt32(5);
                    NewLD.LicenseDuration = SQLReader.GetInt32(6);
                    NewLD.RequireValidation = SQLReader.GetInt32(7);
                    NewLD.IsTrial = SQLReader.GetInt32(8);
                }
                SQLReader.Close();
                SQLConn.Close();
               
                //retuen error after logging activation attempt
                if (NewMachineData== null || NewLD == null)
                {
                    Response = String.Format(Response, "Fail", "100", "Invalid License Key");
                    return Response;
                }

                //Activate new license, check to see if it is valid for this machine
                if (NewLD.MachineData == null)
               {
                   NewLD.MachineData = NewMachineData;
                    if (NewLD.FirstActivationDate == DateTime.MinValue)
                        NewLD.FirstActivationDate = DateTime.Now;
                   if (OldLD == null || OldLD.IsTrial == 1)
                   {
                       Response = String.Format(Response, "Success", "0", GetActivatePackage(NewLD));
                       success = true;
                   }
                   //Check to see if it is a subscription uprade and add durration
                   else if (OldLD.IsSubscription == 1)
                   {
                      ts = DateTime.Now - OldLD.FirstActivationDate;
                      NewLD.LicenseDuration += OldLD.LicenseDuration - (int)ts.TotalDays;
                      Response = String.Format(Response, "Success", "0", GetActivatePackage(NewLD));
                      success = true;
                   }
                   else
                   {
                       Response = String.Format(Response, "Fail", "106", "Invalid License Combination");
                       success = false;
                   }
               }
               //Trying to acitivate a used license or a new version on an upgrade license
               else
               {
                    //If no license data then use machine data from request
                   if (OldLD.MachineData == null)
                       OldLD.MachineData = NewMachineData;
                    ts = DateTime.Now - NewLD.FirstActivationDate;

                   //If Update on subcription
                   if ((OldLD.MachineData.machineKey == NewLD.MachineData.machineKey) && (NewLD.LicenseDuration > ts.TotalDays) && NewLD.IsSubscription == 1)
                   {
                       Response = String.Format(Response, "Success", "0", GetActivatePackage(NewLD));
                       success = true;
                   }

                  //this key is alrady activated, maybe lost HD allow activation on new machine if more than 90 days
                   else
                   {                       
                       ts = DateTime.Now - NewLD.LastActivation;
                       if (ts.TotalDays < 90)
                           Response = String.Format(Response, "Fail", "101", "Already Activated");
                       else
                       {
                           Response = String.Format(Response, "Success", "0", GetActivatePackage(NewLD));
                           success = true;
                       }
                   }
               }
            
                if (success)
                {
                    SQLConn.Open();
                    SQL = @"UPDATE LICENSE SET MachineKey = @MachineKey, MachineData = @MachineData, LastActivateDate = GETDATE(), Duration = CASE WHEN @Duration <>  0 THEN @Duration ELSE NULL END, FirstActivationDate = CASE WHEN FirstActivationDate IS NULL THEN GetDATE() ELSE FirstActivationDate END WHERE LicenseID = @LicenseID";
                    SQLComm = new SqlCommand(SQL, SQLConn);
                    SQLComm.Parameters.AddWithValue("@LicenseID", NewLD.LicenseKey);
                    SQLComm.Parameters.AddWithValue("@MachineKey", NewLD.MachineData.machineKey);
                    SQLComm.Parameters.AddWithValue("@MachineData", NewLD.MachineData.Serialize(false));
                    SQLComm.Parameters.AddWithValue("@Duration", NewLD.LicenseDuration);
                    SQLComm.ExecuteNonQuery();
                    SQLConn.Close();
                }
               
            }
            catch 
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
            string SQL = @"UPDATE License SET MachineKey = null, MachineData =NULL WHERE LicenseID = @LicenseID AND MachineKey = @MachineKey";
            SQLConn.Open();
            try
            {
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.Parameters.AddWithValue("@LicenseID", OldLD.LicenseKey);
                SQLComm.Parameters.AddWithValue("@MachineKey", OldLD.MachineData.machineKey);
                int rows = SQLComm.ExecuteNonQuery();                        
                if (rows == 0)
                    Response = String.Format(Response, "Fail", "105", "Invalid LicenseKey or MachineKey");                    
                else
                    Response = String.Format(Response, "Success", "0", "");
                SQLConn.Close();
            }            
            catch 
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
            LicenseData LastLD = OldLD;
            LicenseData ld = new LicenseData();

            string SQL = @"SELECT MachineData,LastActivateDate,Quantity,l.SKU,FirstActivationDate,IsSubscription,ISNULL(l.Duration,s.Duration) FROM License l INNER JOIN SKU s ON l.SKU = s.SKU  WHERE LicenseID = @LicenseID AND MachineKey = @MachineKey";

            try
            {
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.Parameters.AddWithValue("@LicenseID", LastLD.LicenseKey);
                SQLComm.Parameters.AddWithValue("@MachineKey", LastLD.MachineData.machineKey);
                
                SQLReader = SQLComm.ExecuteReader();
                while (SQLReader.Read())
                {
                    if (!SQLReader.IsDBNull(0))
                        ld.MachineData = new MachineId(SQLReader.GetXmlReader(0));
                    if (!SQLReader.IsDBNull(1))
                        ld.LastActivation = SQLReader.GetDateTime(1);
                    ld.Quantity = SQLReader.GetInt32(2);
                    ld.SKU = SQLReader.GetString(3);
                    if (!SQLReader.IsDBNull(4))
                        ld.FirstActivationDate = SQLReader.GetDateTime(4);
                    ld.IsSubscription = SQLReader.GetInt32(5);
                    ld.LicenseDuration = SQLReader.GetInt32(6);
                }
                SQLReader.Close();
                SQLConn.Close();


                if (ld.MachineData.machineKey == null)
                    Response = String.Format(Response, "Fail", "105", "Invalid License Key or Machine Key");
                else
                {
                    TimeSpan ts = DateTime.Now - ld.FirstActivationDate;
                    if (ld.LicenseDuration < ts.TotalDays )
                        Response = String.Format(Response, "Fail", "200", "Subcription Expired");
                    else
                        Response = String.Format(Response, "Success", "0", "");
                }
            }
            catch 
            {
                SQLConn.Close();
                Response = String.Format(Response, "Fail", "3", "Server Error");
            }
            return Response;
        }

       
    }
}