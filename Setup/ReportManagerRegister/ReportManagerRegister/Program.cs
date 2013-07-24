using System;

namespace ReportManagerRegister
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Register will help to do the registe work !");
            try
            {
                //0 args[0] RegisteType Update config or web server
                if (args[0].Equals("AppConfig"))
                {
                    ReportManagerConfig.UpdateWebConfig(args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
                    //1 "$INSTDIR" 
                    //2 "$hCtl_ApplicationConfig_WSUrl_State" 
                    //3 "$hCtl_ApplicationConfig_Domain_State" 
                    //4 "$hCtl_ApplicationConfig_Account_State" 
                    //5 "$hCtl_ApplicationConfig_Password_State" 
                    //6 "$hCtl_ApplicationConfig_DataSource_State" 
                    //7 "$hCtl_ApplicationConfig_Database_State" 
                    //8 "$hCtl_ApplicationConfig_DBAccount_State" 
                    //9 "$hCtl_ApplicationConfig_DBPassword_State"'
                }
                else if (args[0].Equals("WebServerConfig"))
                {
                    string bindingAddress = string.Empty;
                    if (args[2].Equals("1")) //IIS Server
                    {
                        //ip:port:domain
                        bindingAddress = string.Format("{0}:{1}:{2}", args[5], args[6], "");
                        ReportManagerConfig.CreateAnIISSite(args[4], args[1], bindingAddress);
                    }
                    else //UWS Server
                    {
                        bindingAddress = string.Format("http://{0}:{1}", args[5], args[6]);
                        ReportManagerConfig.CreateAnUWSSite(args[4], args[1], bindingAddress);
                    }
                    //1 "$INSTDIR"
                    //2 "$hCtl_WebServerConfig_TypeIIS_State"
                    //3 "$hCtl_WebServerConfig_TypeUWS_State"
                    //4 "$hCtl_WebServerConfig_SiteName_State" 
                    //5 "$hCtl_WebServerConfig_Address_State" 
                    //6 "$hCtl_WebServerConfig_Port_State"'

                }
                Console.WriteLine("Press any key to exist..");
            }
            catch (Exception ex)
            {
                Console.WriteLine("Registe process is block by an exception, message as below:");
                Console.WriteLine(ex.Message);
            }
            Console.Read();
        }
    }
}
