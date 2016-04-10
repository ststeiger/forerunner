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
using System.Globalization;

namespace ForerunnerLicense
{

    public class ServerLicense
    {
        string Response = "<LicenseResponse><Status>{0}</Status><StatusCode>{1}</StatusCode><Value>{2}</Value></LicenseResponse>";
        public string NewLicenseKey = null;
        public string MergeKey = null;
        public int NumberOfCores = 0;
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
                        case "MergeKey":
                            MergeKey = XMLReq.ReadElementContentAsString();
                            break;
                        case "NumberOfCores":
                            NumberOfCores = XMLReq.ReadElementContentAsInt();
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
                if (OldLD.LicenseKey != null)
                    OldLD = LoadLicenseFromServer(OldLD.LicenseKey);
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
                case "Merge":
                    return ProcessMerge();
                case "Split":
                    return ProcessSplit();
            }

            return String.Format(Response, "Fail", "2", "Invalid License Request");
        }

        private string GetActivatePackage(LicenseData ld)
        {
            string value = "<License><SKU>{0}</SKU><Quantity>{1}</Quantity>{2}<LicenseKey>{3}</LicenseKey><RequireValidation>{4}</RequireValidation><ActivationDate>{5}</ActivationDate><LicenseDuration>{6}</LicenseDuration><IsTrial>{7}</IsTrial></License>";
            return LicenseUtil.Sign(string.Format(value, ld.SKU, ld.Quantity, ld.MachineData.Serialize(false,true), ld.LicenseKey, ld.RequireValidation, ld.FirstActivationDate.ToString( CultureInfo.CreateSpecificCulture("en-us")), ld.LicenseDuration,ld.IsTrial), pkey);
        }

        private string getLicenseClass(string SKU)
        {
            string retval = "";

            int dash = SKU.IndexOf("-");

            if (dash >=0)
                retval = SKU.Substring(dash);

            return retval;
        }
        private string ProcessMerge()
        {
           
            LicenseData Lic = LoadLicenseFromServer(NewLicenseKey);
            LicenseData MergeLic = LoadLicenseFromServer(MergeKey);

            if (Lic == null || MergeLic == null)
            {
                return String.Format(Response, "Fail", "110", "Invalid License combination or license not found");
            }

            if (NewLicenseKey == MergeKey)
            {
                Response = String.Format(Response, "Fail", "110", "Cannot merge the same key");
                return Response;
            }

            if (Lic.SKU == MergeLic.SKU)
            {
                if (MergeLic.LicenseType == "Sub")
                {
                    Lic.LicenseDuration += MergeLic.LicenseDuration;
                    MergeLic.LicenseDuration = 0;
                }
                else
                {
                    Lic.Quantity += MergeLic.Quantity;
                    MergeLic.Quantity = 0;
                }
                 
            }

            else if (MergeLic.IsExtension == 1 )
            {
                if (MergeLic.Quantity != Lic.Quantity)
                    return String.Format(Response, "Fail", "115", "Extension License must have same number of cores as license");

                if (MergeLic.IsTrial != Lic.IsTrial || MergeLic.IsSubscription != Lic.IsSubscription || Lic.LicenseType != MergeLic.LicenseType)
                    return String.Format(Response, "Fail", "116", "Invalid license combination");
                
                if(getLicenseClass(Lic.SKU) != getLicenseClass(MergeLic.SKU))
                    return String.Format(Response, "Fail", "117", "Invalid license combination, invalid dev,test production combination");

                Lic.LicenseDuration += MergeLic.LicenseDuration;
                MergeLic.LicenseDuration = 0;

            }
            else
            {
                Response = String.Format(Response, "Fail", "118", "Cannot merge keys");
                return Response;
            }
            string SQL = @"UPDATE License SET Quantity = @NewQuantity, Duration = @NewDuration WHERE LicenseID = @LicenseKey
                           UPDATE License SET Quantity =0, Duration = 0 WHERE LicenseID = @MergeKey ";

            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();

            try
            {

                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.Parameters.AddWithValue("@LicenseKey", NewLicenseKey);
                SQLComm.Parameters.AddWithValue("@MergeKey", MergeKey);
                SQLComm.Parameters.AddWithValue("@NewQuantity", Lic.Quantity);
                SQLComm.Parameters.AddWithValue("@NewDuration", Lic.LicenseDuration);

                SQLComm.ExecuteNonQuery();               
                SQLConn.Close();
                Response = String.Format(Response, "Success", "0", "Merge Sucessfull");
            }
            catch
            {
                SQLConn.Close();
                Response = String.Format(Response, "Fail", "3", "Server Error");
            }
            return Response;
        }

        private LicenseData LoadLicenseFromServer(string key)
        {
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();
            SqlDataReader SQLReader;
            LicenseData NewLD = null;
                    
            string SQL = @"SELECT MachineData,LastActivateDate,Quantity,l.SKU,FirstActivationDate,IsSubscription,ISNULL(l.Duration,s.Duration),RequireValidation,IsTrial,l.CreateDate,s.IsExtension,LicenseType FROM License l INNER JOIN SKU s ON l.SKU = s.SKU  WHERE LicenseID = @LicenseID";
            try
            {
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.Parameters.AddWithValue("@LicenseID", key);

                SQLReader = SQLComm.ExecuteReader();
                while (SQLReader.Read())
                {
                    NewLD = new LicenseData();
                    NewLD.LicenseKey = key;
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
                    NewLD.PurchaseDate = SQLReader.GetDateTime(9);
                    NewLD.IsExtension = SQLReader.GetInt32(10);
                    NewLD.LicenseType = SQLReader.GetString(11);
                }
                SQLReader.Close();
                return NewLD;
            }
            catch (Exception /*e*/)
            {
                return NewLD;
            }
            finally
            {
                SQLConn.Close();
            }
        }

        const int TrialExtensionDays = 14;
        public string ExtendTrial(string LicenseKey, int Hash)
        {
            if (Hash != DateTime.Now.Month)
            {
                return String.Format(Response, "Fail", "400", "Incorrect Hash");
            }

            LicenseData licenseData = LoadLicenseFromServer(LicenseKey);
            if (licenseData == null)
            {
                return String.Format(Response, "Fail", "404", "License key not found");
            }

            DateTime curExpiration = licenseData.PurchaseDate + TimeSpan.FromDays(licenseData.LicenseDuration);
            DateTime newExpiration = DateTime.Now + TimeSpan.FromDays(TrialExtensionDays);
            if (newExpiration > curExpiration)
            {
                TimeSpan span = newExpiration - licenseData.PurchaseDate;
                return ExtendTrialDuration(LicenseKey, licenseData.PurchaseDate, Convert.ToInt32(span.TotalDays));
            }

            return String.Format(Response, "Success", "200", "Trial license already greater than or equal to: " + TrialExtensionDays.ToString() + " days from now. Current Expiration: " + curExpiration.ToLocalTime().ToShortDateString());
        }

        private string ExtendTrialDuration(string LicenseKey, DateTime PurchaseDate, int Durration)
        {
            DateTime NewExpiration = PurchaseDate + TimeSpan.FromDays(Durration);
            String returnString = String.Format(Response, "Success", "200", "Trial license extended to: " + NewExpiration.ToLocalTime().ToShortDateString());

            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();

            string SQL = @"UPDATE License Set Duration = @Durration WHERE LicenseID = @LicenseID AND SKU = 'MobTrial'";
            try
            {
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.Parameters.AddWithValue("@Durration", Durration);
                SQLComm.Parameters.AddWithValue("@LicenseID", LicenseKey);
                SQLComm.ExecuteNonQuery();
                SQLConn.Close();
            }
            catch
            {
                if (SQLConn.State != System.Data.ConnectionState.Closed)
                    SQLConn.Close();

                returnString = String.Format(Response, "Fail", "3", "Server Error - ExtendTrialDuration");
            }

            return returnString;
        }

        public string Info(string LicenseKey)
        {
            string Info;

            LicenseData licenseData = LoadLicenseFromServer(LicenseKey);
            if (licenseData == null)
            {
                return String.Format(Response, "Fail", "404", "License key not found");
            }

            DateTime curExpiration = licenseData.PurchaseDate + TimeSpan.FromDays(licenseData.LicenseDuration);
            if (licenseData.MachineData == null)
            {
                Info =
                    "<LicenseResponse>" +
                    "  <Status>{0}</Status>" +
                    "  <StatusCode>{1}</StatusCode>" +
                    "  <SKU>{2}</SKU>" +
                    "  <Expiration>{3}</Expiration>" +
                    "  <LastActivation>{4}</LastActivation>" +
                    "  <IsSubscription>{5}</IsSubscription>" +
                    "  <Quantity>{6}</Quantity>" +
                    "  <MachineData>" +
                    "    <HostName>Key not currently assigned to a host</HostName>" +
                    "  </MachineData>" +
                    "</LicenseResponse>";

                return String.Format(Info,
                                     "Success",
                                     "200",
                                     licenseData.SKU,
                                     curExpiration.ToLocalTime().ToShortDateString(),
                                     licenseData.LastActivation.ToLocalTime().ToShortDateString(),
                                     licenseData.IsSubscription,
                                     licenseData.Quantity);
            }

            Info =
                "<LicenseResponse>" +
                "  <Status>{0}</Status>" +
                "  <StatusCode>{1}</StatusCode>" +
                "  <SKU>{2}</SKU>" +
                "  <Expiration>{3}</Expiration>" +
                "  <LastActivation>{4}</LastActivation>" +
                "  <IsSubscription>{5}</IsSubscription>" +
                "  <Quantity>{6}</Quantity>" +
                "  <MachineData>" +
                "    <HostName>{7}</HostName>" +
                "    <NumberOfCores>{8}</NumberOfCores>" +
                "  </MachineData>" +
                "</LicenseResponse>";

            return String.Format(Info,
                                 "Success",
                                 "200",
                                 licenseData.SKU,
                                 curExpiration.ToLocalTime().ToShortDateString(),
                                 licenseData.LastActivation.ToLocalTime().ToShortDateString(),
                                 licenseData.IsSubscription,
                                 licenseData.Quantity,
                                 licenseData.MachineData.hostName,
                                 licenseData.MachineData.numberOfCores);
        }

        private string ProcessActivate()
        {
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();
            bool success = false;
            LicenseData NewLD = null;
            TimeSpan LicenseSpan;

           string SQL = @"UPDATE License Set ActivationAttempts = ActivationAttempts+1 WHERE LicenseID = @LicenseID";                          
           try
            {
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.Parameters.AddWithValue("@LicenseID", NewLicenseKey);
                SQLComm.ExecuteNonQuery();
                SQLConn.Close();
                
               NewLD = LoadLicenseFromServer(NewLicenseKey);
               OldLD = LoadLicenseFromServer(OldLD.LicenseKey);

                //return error after logging activation attempt
                if (NewMachineData== null || NewLD == null)
                {
                    Response = String.Format(Response, "Fail", "100", "Invalid License Key");
                    return Response;
                }

                if (NewLD.IsExtension ==1)
                {
                    Response = String.Format(Response, "Fail", "120", "Cannot activate Extension license, please merge license");
                    return Response;
                }

                //Activate new license, check to see if it is valid for this machine
                if (NewLD.MachineData == null)
               {
                   NewLD.MachineData = NewMachineData;
                    if (NewLD.FirstActivationDate == DateTime.MinValue)
                        NewLD.FirstActivationDate = DateTime.Now;
                   
                    //Check for subscription expiration
                    LicenseSpan = DateTime.Now - NewLD.PurchaseDate;
                    if ((NewLD.IsSubscription == 1) && LicenseSpan.TotalDays > NewLD.LicenseDuration)
                    {
                        Response = String.Format(Response, "Fail", "200", "Subscription Expired");
                        success = false;
                    }
                   
                    Response = String.Format(Response, "Success", "0", GetActivatePackage(NewLD));
                    success = true;
               }
               //Trying to acitivate a used license or a new version on an upgradable license
               else
               {
                    //If no license data then use machine data from request
                   if (OldLD == null || OldLD.MachineData == null)
                   {
                       OldLD = new LicenseData();
                       OldLD.MachineData = NewMachineData;
                   }
                   LicenseSpan = DateTime.Now - NewLD.PurchaseDate;

                   //If Update on subcription
                   if (OldLD.MachineData.IsSame(NewLD.MachineData))
                   {
                       // if not a subscription
                       if (NewLD.IsSubscription == 0 )
                       {
                            Response = String.Format(Response, "Success", "0", GetActivatePackage(NewLD));
                            success = true;
                       }
                       else if (NewLD.LicenseDuration > LicenseSpan.TotalDays)
                       {
                           Response = String.Format(Response, "Success", "0", GetActivatePackage(NewLD));
                           success = true;

                       }
                       else
                       {
                           Response = String.Format(Response, "Fail", "200", "Subscription Expired");
                           success = false;
                       }
                   }

                  //this key is already activated, maybe lost HD allow activation on new machine if more than 90 days
                   else
                   {               
                       if (LicenseSpan.TotalDays < 90)
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
                if (SQLConn.State != System.Data.ConnectionState.Closed)
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

        private string ProcessSplit()
        {
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();

            if (NumberOfCores == 0 || NumberOfCores >= OldLD.Quantity)
            {
                Response = String.Format(Response, "Fail", "115", "Invalid Number of Cores");
                return Response;
            }
               
            
            string SQL = @"UPDATE License SET Quantity = @NewQuantity WHERE LicenseID = @LicenseID AND MachineKey = @MachineKey";
            SQLConn.Open();
            try
            {
                int NewQuantity = OldLD.Quantity-NumberOfCores;
                int NewLicQuantity = NumberOfCores;
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.Parameters.AddWithValue("@LicenseID", OldLD.LicenseKey);
                SQLComm.Parameters.AddWithValue("@MachineKey", OldLD.MachineData.machineKey);
                SQLComm.Parameters.AddWithValue("@NewQuantity", NewQuantity);
                int rows = SQLComm.ExecuteNonQuery();
                SQLConn.Close();
                if (rows == 0)
                    Response = String.Format(Response, "Fail", "105", "Invalid LicenseKey or MachineKey");
                else
                {
                    string NewLic = ForerunnerDB.NewLicenseID();
                    Response = String.Format(Response, "Success", "0", NewLic);
                    new Order().WriteLicense(Guid.NewGuid().ToString(), OldLD.SKU, "", NewLicQuantity, NewLic, OldLD.LicenseKey, OldLD.PurchaseDate);
                }                
                
            }
            catch
            {
                Response = String.Format(Response, "Fail", "3", "Server Error");
                SQLConn.Close();               
            }

            return Response;

        }
        private string ProcessValidate()
        {
            ForerunnerDB DB = new ForerunnerDB();
            LicenseData ld = new LicenseData();


            try
            {
                ld = LoadLicenseFromServer(OldLD.LicenseKey);

                if (ld.MachineData == null || ld.MachineData.machineKey != OldLD.MachineData.machineKey )
                    Response = String.Format(Response, "Fail", "105", "Invalid License Key or Machine Key");
                else
                {
                    TimeSpan ts = DateTime.Now - ld.PurchaseDate;
                    if (ld.LicenseDuration < ts.TotalDays && (ld.IsSubscription ==1 ))
                        Response = String.Format(Response, "Fail", "200", "Subscription Expired");
                    else
                        Response = String.Format(Response, "Success", "0", LicenseUtil.Sign(DateTime.Now.ToUniversalTime().Ticks.ToString(),pkey));
                }
            }
            catch 
            {                
                Response = String.Format(Response, "Fail", "3", "Server Error");
            }
            return Response;
        }

       
    }
}