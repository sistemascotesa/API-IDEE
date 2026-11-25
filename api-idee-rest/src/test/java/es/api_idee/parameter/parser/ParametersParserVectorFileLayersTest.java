package es.api_idee.parameter.parser;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

import com.sun.jersey.core.util.MultivaluedMapImpl;

import es.api_idee.builder.JSBuilder;
import es.api_idee.parameter.Parameters;

/**
 * Contrato del servidor para las capas KML, KMZ y GPX del parámetro "layers":
 * el servidor no interpreta el formato, solo separa las entradas por comas y
 * las entrega sin cambios al visor generado.
 */
public class ParametersParserVectorFileLayersTest {

   private static final String BASE = "QUICK*Base_IGNBaseTodo_TMS";

   private static final String KML_URL = "https://componentes.idee.es/estaticos/Datos/KML/las_huertas_n1.kml";

   private static final String KMZ_URL = "https://openlayers.org/en/latest/examples/data/kmz/iceland.kmz";

   private static final String GPX_URL = "https://openlayers.org/en/latest/examples/data/gpx/fells_loop.gpx";

   private static final String KML = "KML*name=las_huertas;url=" + KML_URL + ";extract=true;visibility=true";

   private static final String KMZ = "KMZ*name=islandia;url=" + KMZ_URL + ";extract=true;visibility=true";

   private static final String GPX = "GPX*name=fells_loop;url=" + GPX_URL + ";extract=true;visibility=true";

   /**
    * URL "'https://componentes.idee.es/estaticos/Datos/KML/las_huertas_n1.kml?version=1,2;3'"
    * codificada con base64~, como la genera IDEE.utils.serializeUrlParams.
    */
   private static final String KML_BASE64_URL = "KML*name=kml_base64;url=base64~"
      + "J2h0dHBzOi8vY29tcG9uZW50ZXMuaWRlZS5lcy9lc3RhdGljb3MvRGF0b3MvS01ML2xhc19odWVydGFzX24xLmttbD92ZXJzaW9uPTEsMjszJw==;"
      + "extract=true;visibility=true";

   private static final String KML_POSITIONAL = "KML*Las Huertas*" + KML_URL + "*true*true";

   private static final String KMZ_POSITIONAL = "KMZ*islandia*" + KMZ_URL + "*true";

   private static final String GPX_POSITIONAL = "GPX*fells_loop*" + GPX_URL + "*true*true";

   @Test
   public void keepsNamedVectorFileLayers () {
      assertEquals(Arrays.asList(BASE, KML, KMZ, GPX),
         ParametersParser.parseLayers(BASE + "," + KML + ", " + KMZ + " ," + GPX));
   }

   @Test
   public void keepsBase64ValuesWithCommasInASingleLayer () {
      assertEquals(Arrays.asList(KML_BASE64_URL, GPX),
         ParametersParser.parseLayers(KML_BASE64_URL + "," + GPX));
   }

   @Test
   public void splitsUnencodedCommasInsideValues () {
      String rawUrl = "KML*name=a;url=" + KML_URL + "?version=1,2;extract=true";

      assertEquals(Arrays.asList("KML*name=a;url=" + KML_URL + "?version=1", "2;extract=true"),
         ParametersParser.parseLayers(rawUrl));
   }

   @Test
   public void keepsPositionalVectorFileLayers () {
      assertEquals(Arrays.asList(KML_POSITIONAL, KMZ_POSITIONAL, GPX_POSITIONAL),
         ParametersParser.parseLayers(KML_POSITIONAL + "," + KMZ_POSITIONAL + "," + GPX_POSITIONAL));
   }

   @Test
   public void passesVectorFileLayersToTheGeneratedViewer () {
      List<String> expected = Arrays.asList(BASE, KML, KMZ, GPX, KML_BASE64_URL, KML_POSITIONAL);
      String layersParam = String.join(",", expected);

      MultivaluedMapImpl queryParams = new MultivaluedMapImpl();
      queryParams.putSingle("layers", layersParam);
      Parameters parameters = ParametersParser.parse(queryParams);

      List<String> layers = new ArrayList<String>();
      for (String entry : ParametersParser.parseLayers(layersParam)) {
         layers.add(JSBuilder.createLayerWithParams(entry));
      }
      parameters.clearLayers();

      String code = JSBuilder.build(parameters, new LinkedList<String>(), null, layers, null);

      assertTrue(code.startsWith("IDEE.map("));
      assertTrue(code.endsWith(")"));
      assertFalse(code.contains(".addLayers("));
      JSONObject mapParams = new JSONObject(code.substring("IDEE.map(".length(), code.length() - 1));
      assertEquals("map", mapParams.getString("container"));
      JSONArray generatedLayers = mapParams.getJSONArray("layers");
      assertEquals(expected.size(), generatedLayers.length());
      for (int i = 0; i < expected.size(); i++) {
         assertEquals(expected.get(i), generatedLayers.getString(i));
      }
   }
}
