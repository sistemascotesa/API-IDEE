package es.api_idee.builder;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import org.json.JSONObject;
import org.junit.Test;
import static org.junit.Assert.*;
import es.api_idee.parameter.PluginAPI;
import es.api_idee.parameter.PluginAPIParam;

public class ShareMapPluginParametersTest {
   private PluginAPI definition(String name) {
      return new PluginAPI(name, "*", "IDEE.plugin." + name, Collections.singletonList(
         new PluginAPIParam(PluginAPIParam.OBJECT, Arrays.asList(
            new PluginAPIParam(PluginAPIParam.SIMPLE, "position", 0),
            new PluginAPIParam(PluginAPIParam.BOOLEAN, "shareBaseLayer", 14)
         ))
      ));
   }

   private JSONObject options(String name, String value) {
      String js = JSBuilder.createPlugin(definition(name), value);
      return new JSONObject(js.substring(js.indexOf('(') + 1, js.lastIndexOf(')')));
   }

   @Test
   public void base64OptionsReachTheConstructorAsBooleans() {
      for (boolean flag : new boolean[] {false, true}) {
         String json = new JSONObject().put("shareBaseLayer", flag).toString();
         String encoded = Base64.getEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));
         JSONObject parsed = options("ShareMap", "base64=" + encoded);
         assertEquals(flag, parsed.getBoolean("shareBaseLayer"));
         assertFalse(parsed.has("base64"));
      }
   }

   @Test
   public void namedParametersKeepTheirExistingParser() {
      JSONObject parsed = options("ShareMap", "position=left;shareBaseLayer=true");
      assertEquals("left", parsed.getString("position"));
      assertTrue(parsed.getBoolean("shareBaseLayer"));
      assertEquals("right", options("Basic", "position=right").getString("position"));
   }

   @Test
   public void trailingOptionPreservesPositionalAndLegacyUrls() {
      for (boolean flag : new boolean[] {false, true}) {
         String[] fields = new String[15];
         Arrays.fill(fields, "");
         fields[0] = "left";
         fields[14] = Boolean.toString(flag);
         JSONObject parsed = options("ShareMap", String.join("*", fields));
         assertEquals("left", parsed.getString("position"));
         assertEquals(flag, parsed.getBoolean("shareBaseLayer"));
      }
      JSONObject legacy = options("ShareMap", "right");
      assertEquals("right", legacy.getString("position"));
      assertFalse(legacy.has("shareBaseLayer"));
   }
}
