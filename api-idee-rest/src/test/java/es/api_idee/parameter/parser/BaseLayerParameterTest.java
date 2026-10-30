package es.api_idee.parameter.parser;

import com.sun.jersey.core.util.MultivaluedMapImpl;
import org.json.JSONObject;
import org.junit.Test;
import static org.junit.Assert.*;

public class BaseLayerParameterTest {
   @Test
   public void absentParameterKeepsPreviousConfiguration() {
      MultivaluedMapImpl query = new MultivaluedMapImpl();
      query.add("layers", "OSM");
      JSONObject result = ParametersParser.parse(query).toJSON();
      assertFalse(result.has("baseLayer"));
      assertEquals("OSM", result.getJSONArray("layers").getString(0));
   }

   @Test
   public void baseLayerIsIndependentFromInformativeLayers() {
      for (String base : new String[] {"XYZ*name=fondo;url=base64~YWJj",
            "LayerGroup*name=hibrido;layers=base64~YWJj"}) {
         MultivaluedMapImpl query = new MultivaluedMapImpl();
         query.add("baselayer", base);
         query.add("layers", "OSM");
         JSONObject result = ParametersParser.parse(query).toJSON();
         assertEquals(base, result.getString("baseLayer"));
         assertEquals("OSM", result.getJSONArray("layers").getString(0));
      }
   }
}
