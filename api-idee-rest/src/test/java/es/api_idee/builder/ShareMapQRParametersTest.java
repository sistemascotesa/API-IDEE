package es.api_idee.builder;

import java.io.File;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import org.json.JSONObject;
import org.junit.Test;
import static org.junit.Assert.*;
import es.api_idee.parameter.PluginAPI;
import es.api_idee.plugins.PluginsManager;

public class ShareMapQRParametersTest {
   // Lee el manifiesto real con el parser de producción, sin modificar su API pública.
   private JSONObject options(String value) throws Exception {
      Method reader = PluginsManager.class.getDeclaredMethod("readPluginFromApi", File.class, JSONObject.class);
      reader.setAccessible(true);
      File manifest = new File("../api-idee-js/src/plugins/sharemap/src/api.json");
      PluginAPI definition = (PluginAPI) reader.invoke(null, manifest, null);
      String js = JSBuilder.createPlugin(definition, value);
      return new JSONObject(js.substring(js.indexOf('(') + 1, js.lastIndexOf(')')));
   }

   @Test
   public void namedLogoReachesTheConstructor() throws Exception {
      JSONObject parsed = options("qrLogo=https://example.test/logo.png;shareBaseLayer=true");
      assertEquals("https://example.test/logo.png", parsed.getString("qrLogo"));
      assertTrue(parsed.getBoolean("shareBaseLayer"));
   }

   @Test
   public void trailingLogoKeepsLegacyPositions() throws Exception {
      String[] fields = new String[16];
      Arrays.fill(fields, "");
      fields[0] = "left";
      fields[14] = "true";
      fields[15] = "https://example.test/logo.png";
      JSONObject parsed = options(String.join("*", fields));
      assertEquals("left", parsed.getString("position"));
      assertTrue(parsed.getBoolean("shareBaseLayer"));
      assertEquals(fields[15], parsed.getString("qrLogo"));
      assertFalse(options("right").has("qrLogo"));
   }

   @Test
   public void base64PreservesLogoDelimitersAndFilters() throws Exception {
      JSONObject original = new JSONObject().put("qrLogo", "https://example.test/logo.svg?a=1*b&c=2")
         .put("filterLayers", Arrays.asList("info")).put("shareBaseLayer", true);
      String encoded = Base64.getEncoder().encodeToString(original.toString().getBytes(StandardCharsets.UTF_8));
      JSONObject parsed = options("base64=" + encoded);
      assertEquals(original.getString("qrLogo"), parsed.getString("qrLogo"));
      assertEquals("info", parsed.getJSONArray("filterLayers").getString(0));
      assertTrue(parsed.getBoolean("shareBaseLayer"));
   }
}
