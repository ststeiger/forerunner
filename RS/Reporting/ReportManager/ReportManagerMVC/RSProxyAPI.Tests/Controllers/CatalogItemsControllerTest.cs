using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Web.Http;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using RSProxyAPI;
using RSProxyAPI.Controllers;
using ForeRunner.RSProxy;

namespace RSProxyAPI.Tests.Controllers
{
    [TestClass]
    public class CatalogItemsControllerTest
    {
        [TestMethod]
        public void Get()
        {
            // Arrange
            CatalogItemsController controller = new CatalogItemsController();

            // Act
            IEnumerable<CatalogItem> result = controller.Get();

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(9, result.Count());
        }

        [TestMethod]
        public void GetByPath()
        {
            // Arrange
            CatalogItemsController controller = new CatalogItemsController();

            // Act
            IEnumerable<CatalogItem> result = controller.Get("TestPath");

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(4, result.Count());
        }
    }
}
