namespace ReportMannagerConfigTool
{
    partial class frmActivation
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.cmdClose = new System.Windows.Forms.Button();
            this.tabControl1 = new System.Windows.Forms.TabControl();
            this.tabPage1 = new System.Windows.Forms.TabPage();
            this.cmdActivate = new System.Windows.Forms.Button();
            this.label3 = new System.Windows.Forms.Label();
            this.txtLicenseKey = new System.Windows.Forms.TextBox();
            this.cmdGetActivation = new System.Windows.Forms.Button();
            this.label1 = new System.Windows.Forms.Label();
            this.txtActivationCode = new System.Windows.Forms.TextBox();
            this.tabPage2 = new System.Windows.Forms.TabPage();
            this.cmdValidate = new System.Windows.Forms.Button();
            this.cmdGetValidateKey = new System.Windows.Forms.Button();
            this.label2 = new System.Windows.Forms.Label();
            this.txtValidate = new System.Windows.Forms.TextBox();
            this.tabControl1.SuspendLayout();
            this.tabPage1.SuspendLayout();
            this.tabPage2.SuspendLayout();
            this.SuspendLayout();
            // 
            // cmdClose
            // 
            this.cmdClose.DialogResult = System.Windows.Forms.DialogResult.Cancel;
            this.cmdClose.Location = new System.Drawing.Point(311, 226);
            this.cmdClose.Name = "cmdClose";
            this.cmdClose.Size = new System.Drawing.Size(75, 23);
            this.cmdClose.TabIndex = 1;
            this.cmdClose.Text = "Close";
            this.cmdClose.UseVisualStyleBackColor = true;
            this.cmdClose.Click += new System.EventHandler(this.cmdClose_Click);
            // 
            // tabControl1
            // 
            this.tabControl1.Controls.Add(this.tabPage1);
            this.tabControl1.Controls.Add(this.tabPage2);
            this.tabControl1.Location = new System.Drawing.Point(1, 1);
            this.tabControl1.Name = "tabControl1";
            this.tabControl1.SelectedIndex = 0;
            this.tabControl1.Size = new System.Drawing.Size(389, 219);
            this.tabControl1.TabIndex = 13;
            // 
            // tabPage1
            // 
            this.tabPage1.Controls.Add(this.cmdActivate);
            this.tabPage1.Controls.Add(this.label3);
            this.tabPage1.Controls.Add(this.txtLicenseKey);
            this.tabPage1.Controls.Add(this.cmdGetActivation);
            this.tabPage1.Controls.Add(this.label1);
            this.tabPage1.Controls.Add(this.txtActivationCode);
            this.tabPage1.Location = new System.Drawing.Point(4, 22);
            this.tabPage1.Name = "tabPage1";
            this.tabPage1.Padding = new System.Windows.Forms.Padding(3);
            this.tabPage1.Size = new System.Drawing.Size(381, 193);
            this.tabPage1.TabIndex = 0;
            this.tabPage1.Text = "Activation";
            this.tabPage1.UseVisualStyleBackColor = true;
            // 
            // cmdActivate
            // 
            this.cmdActivate.Location = new System.Drawing.Point(270, 166);
            this.cmdActivate.Name = "cmdActivate";
            this.cmdActivate.Size = new System.Drawing.Size(102, 23);
            this.cmdActivate.TabIndex = 14;
            this.cmdActivate.Text = "Activate";
            this.cmdActivate.UseVisualStyleBackColor = true;
            this.cmdActivate.Click += new System.EventHandler(this.cmdActivate_Click);
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(3, 5);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(65, 13);
            this.label3.TabIndex = 13;
            this.label3.Text = "License Key";
            // 
            // txtLicenseKey
            // 
            this.txtLicenseKey.Location = new System.Drawing.Point(6, 21);
            this.txtLicenseKey.Name = "txtLicenseKey";
            this.txtLicenseKey.Size = new System.Drawing.Size(96, 20);
            this.txtLicenseKey.TabIndex = 12;
            // 
            // cmdGetActivation
            // 
            this.cmdGetActivation.Location = new System.Drawing.Point(108, 16);
            this.cmdGetActivation.Name = "cmdGetActivation";
            this.cmdGetActivation.Size = new System.Drawing.Size(183, 29);
            this.cmdGetActivation.TabIndex = 11;
            this.cmdGetActivation.Text = "Copy Activation Key to Clipboard";
            this.cmdGetActivation.UseVisualStyleBackColor = true;
            this.cmdGetActivation.Click += new System.EventHandler(this.cmdGetActivation_Click_1);
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(3, 70);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(201, 13);
            this.label1.TabIndex = 10;
            this.label1.Text = "Activation Result for Forerunner Software";
            // 
            // txtActivationCode
            // 
            this.txtActivationCode.Location = new System.Drawing.Point(6, 86);
            this.txtActivationCode.Multiline = true;
            this.txtActivationCode.Name = "txtActivationCode";
            this.txtActivationCode.Size = new System.Drawing.Size(366, 74);
            this.txtActivationCode.TabIndex = 9;
            // 
            // tabPage2
            // 
            this.tabPage2.Controls.Add(this.cmdValidate);
            this.tabPage2.Controls.Add(this.cmdGetValidateKey);
            this.tabPage2.Controls.Add(this.label2);
            this.tabPage2.Controls.Add(this.txtValidate);
            this.tabPage2.Location = new System.Drawing.Point(4, 22);
            this.tabPage2.Name = "tabPage2";
            this.tabPage2.Padding = new System.Windows.Forms.Padding(3);
            this.tabPage2.Size = new System.Drawing.Size(381, 193);
            this.tabPage2.TabIndex = 1;
            this.tabPage2.Text = "Validation";
            this.tabPage2.UseVisualStyleBackColor = true;
            // 
            // cmdValidate
            // 
            this.cmdValidate.Location = new System.Drawing.Point(268, 160);
            this.cmdValidate.Name = "cmdValidate";
            this.cmdValidate.Size = new System.Drawing.Size(104, 26);
            this.cmdValidate.TabIndex = 16;
            this.cmdValidate.Text = "Validate";
            this.cmdValidate.UseVisualStyleBackColor = true;
            this.cmdValidate.Click += new System.EventHandler(this.cmdValidate_Click);
            // 
            // cmdGetValidateKey
            // 
            this.cmdGetValidateKey.Location = new System.Drawing.Point(6, 17);
            this.cmdGetValidateKey.Name = "cmdGetValidateKey";
            this.cmdGetValidateKey.Size = new System.Drawing.Size(183, 29);
            this.cmdGetValidateKey.TabIndex = 15;
            this.cmdGetValidateKey.Text = "Copy Validation Key to Clipboard";
            this.cmdGetValidateKey.UseVisualStyleBackColor = true;
            this.cmdGetValidateKey.Click += new System.EventHandler(this.cmdGetValidateKey_Click);
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(3, 64);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(208, 13);
            this.label2.TabIndex = 14;
            this.label2.Text = "Validation Result from Forerunner Software";
            // 
            // txtValidate
            // 
            this.txtValidate.Location = new System.Drawing.Point(6, 80);
            this.txtValidate.Multiline = true;
            this.txtValidate.Name = "txtValidate";
            this.txtValidate.Size = new System.Drawing.Size(366, 74);
            this.txtValidate.TabIndex = 13;
            // 
            // frmActivation
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.CancelButton = this.cmdClose;
            this.ClientSize = new System.Drawing.Size(391, 254);
            this.ControlBox = false;
            this.Controls.Add(this.tabControl1);
            this.Controls.Add(this.cmdClose);
            this.Name = "frmActivation";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
            this.Text = "Activation & Validation";
            this.Load += new System.EventHandler(this.frmActivation_Load);
            this.tabControl1.ResumeLayout(false);
            this.tabPage1.ResumeLayout(false);
            this.tabPage1.PerformLayout();
            this.tabPage2.ResumeLayout(false);
            this.tabPage2.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Button cmdClose;
        private System.Windows.Forms.TabControl tabControl1;
        private System.Windows.Forms.TabPage tabPage1;
        private System.Windows.Forms.Button cmdActivate;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.TextBox txtLicenseKey;
        private System.Windows.Forms.Button cmdGetActivation;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.TextBox txtActivationCode;
        private System.Windows.Forms.TabPage tabPage2;
        private System.Windows.Forms.Button cmdValidate;
        private System.Windows.Forms.Button cmdGetValidateKey;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.TextBox txtValidate;
    }
}