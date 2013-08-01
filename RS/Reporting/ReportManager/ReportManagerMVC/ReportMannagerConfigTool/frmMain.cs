using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace ReportMannagerConfigTool
{
    public partial class frmMain : Form
    {
        public frmMain()
        {
            InitializeComponent();
        }


        private void btnFolderBrowser_Click(object sender, EventArgs e)
        {
            folderSSRS.ShowDialog();
            if (folderSSRS.SelectedPath != "")
                txtReportServer.Text = folderSSRS.SelectedPath;
        }

        private void btnAddEx_Click(object sender, EventArgs e)
        {
            //Copy Files to bin Folder


            //Add settings to Web.config

            //Add settings to rsreportserver.config

            //Add setting to rsrvvpolicy.config

        }
    }
}
