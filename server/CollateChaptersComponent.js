import { collate_chapters_component} from "./documentsLib.js";
//http://127.0.0.1:3000/fid/93,2df1f451da

var CollateChaptersComponent = {
    schema:
    {
      "tags": ['default'],
      "componentKey": "collate_chapters",
      "category": "Document Processing",
      "operation": {
        "schema": {
          "title": "Collate Chapters",
          "type": "object",
          "required": [],
          "properties": {
            "documents": {
              "title": "Documents",
              "type": "array",
              "x-type": "documentArray",
              "description": `Chunk files to collate by chapters.`,
            }           
          }
        },
        "responseTypes": {
          "200": {
            "schema": {
              "title": "JSON",
              "required": [],
              "type": "object",
              "properties": {
                "files": {
                  "title": "Chapterized Chunks CDN",
                  "type": "array",
                  "x-type": "cdnObjectArray",
                  "description": "The chunked text files"
                },              
                "documents": {
                  "title": "Chapterized Chunks Files",
                  "type": "array",
                  "x-type": "documentArray",
                  "description": "The chunked text files"
                },
                "summaries": {
                    "title": "Documents summaries",
                    "type": "array",
                    "x-type": "cdnObjectArray",
                    "description": "A summary of each documents"
                  },
                  "plot_points": {
                    "title": "Documents plot points",
                    "type": "array",
                    "x-type": "cdnObjectArray",
                    "description": "Plot points of each documents"
                  },                                  
              },
            },
            "contentType": "application/json"
          },
        },
        "method": "X-CUSTOM"
      },
    },
    functions: {
      _exec: async (payload, ctx) =>
      {
  
        let return_value = { result: { "ok": false }, documents: [], files: [], summaries: [], plot_points: [] };
        if (payload.documents)
        {
  
          const files = payload.documents;
          const chapter_name_field = "chapter_name_field";
          const current_chapter = "current_chapter";
          const new_chapter = "new_chapter";
          const overwrite = false; // does nothing here actually since it's so fast, we always overwrite
 
          const args = { chapter_name_field: chapter_name_field, current_chapter: current_chapter, new_chapter:new_chapter, overwrite: overwrite };


          const chapters_cdns = [];
          const summary_cdns = [];
          const plot_cdns = [];

          for (let i = 0; i < files.length; i++)
          {
            const chunks_cdn = files[i];
            const results = await collate_chapters_component(ctx, chunks_cdn, args);
            const chapterized_chunks_cdn = results.chapters;
            const summary_cdn = results.summary;
            const plot_cdn = results.plot;

            chapters_cdns.push(chapterized_chunks_cdn);
            summary_cdns.push(summary_cdn);
            plot_cdns.push(plot_cdn);   
          }
          return_value = { result: { "ok": true }, files: chapters_cdns, documents: chapters_cdns, summaries: summary_cdns, plot_points: plot_cdns};
        }
  
        return return_value;


      }
    }
  };

export {CollateChaptersComponent};
    