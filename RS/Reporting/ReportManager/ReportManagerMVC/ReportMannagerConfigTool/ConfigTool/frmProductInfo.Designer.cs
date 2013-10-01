namespace ReportMannagerConfigTool
{
    partial class frmProductInfo
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
            this.groupBoxProductInfo = new System.Windows.Forms.GroupBox();
            this.txtExpirationDate = new System.Windows.Forms.TextBox();
            this.label2 = new System.Windows.Forms.Label();
            this.txtProductSKU = new System.Windows.Forms.TextBox();
            this.label1 = new System.Windows.Forms.Label();
            this.btnActivateManually = new System.Windows.Forms.Button();
            this.label3 = new System.Windows.Forms.Label();
            this.textBox2 = new System.Windows.Forms.TextBox();
            this.groupBoxProductInfo.SuspendLayout();
            this.SuspendLayout();
            // 
            // groupBoxProductInfo
            // 
            this.groupBoxProductInfo.Controls.Add(this.txtExpirationDate);
            this.groupBoxProductInfo.Controls.Add(this.label2);
            this.groupBoxProductInfo.Controls.Add(this.txtProductSKU);
            this.groupBoxProductInfo.Controls.Add(this.label1);
            this.groupBoxProductInfo.Location = new System.Drawing.Point(12, 12);
            this.groupBoxProductInfo.Name = "groupBoxProductInfo";
            this.groupBoxProductInfo.Size = new System.Drawing.Size(433, 101);
            this.groupBoxProductInfo.TabIndex = 1;
            this.groupBoxProductInfo.TabStop = false;
            this.groupBoxProductInfo.Text = "Product Information";
            this.groupBoxProductInfo.Enter += new System.EventHandler(this.groupBoxProductInfo_Enter);
            // 
            // txtExpirationDate
            // 
            this.txtExpirationDate.CausesValidation = false;
            this.txtExpirationDate.Location = new System.Drawing.Point(89, 55);
            this.txtExpirationDate.Name = "txtExpirationDate";
            this.txtExpirationDate.ReadOnly = true;
            this.txtExpirationDate.Size = new System.Drawing.Size(282, 20);
            this.txtExpirationDate.TabIndex = 3;
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(39, 62);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(44, 13);
            this.label2.TabIndex = 2;
            this.label2.Text = "Expires:";
            // 
            // txtProductSKU
            // 
            this.txtProductSKU.CausesValidation = false;
            this.txtProductSKU.Location = new System.Drawing.Point(89, 20);
            this.txtProductSKU.Name = "txtProductSKU";
            this.txtProductSKU.ReadOnly = true;
            this.txtProductSKU.Size = new System.Drawing.Size(282, 20);
            this.txtProductSKU.TabIndex = 1;
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(11, 27);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(72, 13);
            this.label1.TabIndex = 0;
            this.label1.Text = "Product SKU:";
            this.label1.TextAlign = System.Drawing.ContentAlignment.TopRight;
            // 
            // btnActivateManually
            // 
            this.btnActivateManually.ImeMode = System.Windows.Forms.ImeMode.NoControl;
            this.btnActivateManually.Location = new System.Drawing.Point(361, 455);
            this.btnActivateManually.Name = "btnActivateManually";
            this.btnActivateManually.Size = new System.Drawing.Size(99, 22);
            this.btnActivateManually.TabIndex = 9;
            this.btnActivateManually.Text = "Activate Manually";
            this.btnActivateManually.UseVisualStyleBackColor = true;
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(23, 133);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(47, 13);
            this.label3.TabIndex = 4;
            this.label3.Text = "License:";
            this.label3.Click += new System.EventHandler(this.label3_Click);
            // 
            // textBox2
            // 
            this.textBox2.Location = new System.Drawing.Point(26, 149);
            this.textBox2.Multiline = true;
            this.textBox2.Name = "textBox2";
            this.textBox2.Size = new System.Drawing.Size(433, 300);
            this.textBox2.TabIndex = 11;
            // 
            // frmProductInfo
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(472, 489);
            this.Controls.Add(this.textBox2);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.btnActivateManually);
            this.Controls.Add(this.groupBoxProductInfo);
            this.Name = "frmProductInfo";
            this.Text = "frmProductInfo";
            this.Load += new System.EventHandler(this.frmProductInfo_Load);
            this.groupBoxProductInfo.ResumeLayout(false);
            this.groupBoxProductInfo.PerformLayout();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.GroupBox groupBoxProductInfo;
        private System.Windows.Forms.TextBox txtExpirationDate;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.TextBox txtProductSKU;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Button btnActivateManually;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.TextBox textBox2;
    }
}