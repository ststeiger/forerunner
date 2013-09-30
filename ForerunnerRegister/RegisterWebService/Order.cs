using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Xml;
using System.Data.SqlClient;
using ForerunnerRegister;

namespace ForerunnerWebService
{
    public class Order
    {
        private static string LicenseMailSubject = ConfigurationManager.AppSettings["LicenseMailSubject"];
        private static string LicenseMailBody = ConfigurationManager.AppSettings["LicenseMailBody"];
        private static string LicenseMailFromAccount = ConfigurationManager.AppSettings["LicenseMailFromAccount"];


        public void AddWorkerNewShopifyOrder(string XMLOrder,string HostName)
        {

            (new TaskWorker()).SaveTask("NewShopifyOrder", XMLOrder, HostName);
            
        }

        public string ProcessShopifyOrder(XmlReader XMLOrder)
        {

            string Email = null;
            string GroupID = null;
            string SKU = null;
            string OrderNumber = null;
            string ProductName = null;
            int Quantity = 0;
            TaskWorker Task = new TaskWorker();

            XMLOrder.Read();
            if (XMLOrder.Name != "order")
                return "Not an Order";

            while (XMLOrder.Read())
            {
                switch (XMLOrder.Name)
                {                   
                    case "email":
                        Email = XMLOrder.ReadElementContentAsString();
                        break;
                    case "order-number":
                        OrderNumber = XMLOrder.ReadElementContentAsString();
                        break;
                    default:
                        while (XMLOrder.NodeType != XmlNodeType.EndElement)
                        {
                            XMLOrder.Read();
                        }
                        break;
                    case "line-items":
                        while (XMLOrder.Read())
                        {
                            if (XMLOrder.Name != "line-item")
                                break;
                            SKU = null;
                            Quantity = 0;
                            while (XMLOrder.Read())
                            {
                                switch (XMLOrder.Name)
                                {
                                    case "quantity":
                                        Quantity = XMLOrder.ReadElementContentAsInt();
                                        break;
                                    case "sku":
                                        SKU = XMLOrder.ReadElementContentAsString();
                                        break;
                                    case "name":
                                        ProductName = XMLOrder.ReadElementContentAsString();
                                        break;
                                }
                                if (XMLOrder.NodeType == XmlNodeType.EndElement && XMLOrder.Name == "line-item")
                                {
                                    if (Quantity != 0 && Email != null && SKU != null)
                                    {
                                        GroupID = Guid.NewGuid().ToString();
                                        WriteLicense(GroupID, SKU,ProductName, Quantity);
                                        WriteLicense(GroupID, SKU + "-Dev",ProductName, Quantity);
                                        WriteLicense(GroupID, SKU + "-Test",ProductName, Quantity);
                                        Task.SaveTask("SendLicenseEmail", "<LicenseMail><OrderNumber>" + OrderNumber + "</OrderNumber><Email>" + Email + "</Email><GroupID>" + GroupID + "</GroupID></LicenseMail>");
                                        break;
                                    }
                                    else
                                        return "Invalid Order";
                                }

                            }
                        }
                        break;
                   
                }
            }


            
            return "success";
        }

        private void WriteLicense(string GroupID,string SKU, string ProductName,int Quantity)
        {
            string SQL = @"INSERT License (LicenseID,LicenseGroupID, SKU,ProductName,Quantity,LastActivateDate,ActivationAttempts,CreateDate)
                            SELECT @LicenseID, @GroupID,@SKU,@ProductName,@Quantity,NULL,0,GETDATE()";

            ForerunnerDB DB = new ForerunnerDB();
            string ID = ForerunnerDB.NewLicenseID();

            SqlConnection SQLConn = DB.GetSQLConn();
            SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
            SQLConn.Open();
            try
            {
                SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.Parameters.AddWithValue("@LicenseID", ID);
                SQLComm.Parameters.AddWithValue("@GroupID", GroupID);
                SQLComm.Parameters.AddWithValue("@SKU", SKU);
                SQLComm.Parameters.AddWithValue("@ProductName", ProductName);
                SQLComm.Parameters.AddWithValue("@Quantity", Quantity);
                SQLComm.ExecuteNonQuery();
            }
            catch (Exception e)
            {
                SQLConn.Close();
                throw (e);
            }
            SQLConn.Close();            
        }

        public string SendLicenseMail(XmlReader LicenseXML,TaskWorker tw)
        {
#if DEBUG
                Domain = "localhost";
#endif
            string Email = null;
            string LicensesText = "";
            string GroupID = null;
            string OrderNumber = null;

            LicenseXML.Read();
            if (LicenseXML.Name != "LicenseMail")
                return "Not an License Mail";
            

            LicenseXML.Read();
            while (!LicenseXML.EOF)
            {
                switch (LicenseXML.Name)
                {
                    case "Email":
                        Email = LicenseXML.ReadElementContentAsString();
                        break;
                    case "GroupID":
                        GroupID = LicenseXML.ReadElementContentAsString();
                        break;
                    case "OrderNumber":
                        OrderNumber = LicenseXML.ReadElementContentAsString();
                        break;
                    default:
                        LicenseXML.Read();
                        break;
                }
            }

            //Get the License data from the License Table
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();
            SqlDataReader SQLReader;

            string SQL = @"SELECT LicenseID, SKU,ProductName FROM License WHERE LicenseGroupID = @GroupID";
                            
            SQLConn.Open();
            SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
            SQLComm.Parameters.AddWithValue("@GroupID", GroupID);

            SQLReader = SQLComm.ExecuteReader();            
            while (SQLReader.Read())
            {
                LicensesText += "Product: <b>";
                LicensesText += SQLReader.GetString(2);
                LicensesText += "</b> SKU: <b>";
                LicensesText += SQLReader.GetString(1);
                LicensesText += "</b> License Key: <b>";
                LicensesText += SQLReader.GetString(0);
                LicensesText += "</b><br>";
            }
            SQLReader.Close();
            SQLConn.Close();

            string NewMailBody = String.Format(LicenseMailBody, LicensesText);
            string NewMailSubject = String.Format(LicenseMailSubject, OrderNumber);
            return tw.SendMail(LicenseMailFromAccount, Email, NewMailSubject, NewMailBody);

        }

       
    }
}