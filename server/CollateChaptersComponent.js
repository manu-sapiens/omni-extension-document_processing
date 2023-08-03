// CollateChaptersComponent.js

import { save_text_to_cdn, save_json_to_cdn, get_json_from_cdn } from './cdn.js';
import { console_log } from './utils.js';
import { collate_chapter_chunk } from './chunking.js'

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
 
          const args = { chapter_name_field: chapter_name_field, current_chapter: current_chapter, new_chapter:new_chapter };


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

  async function collate_chapters_component(ctx, chunks_cdn, args)
  {
      console.time("processTime");
  
      const chapter_name_field = args.chapter_name_field || "chapter_name";
      const current_chapter_field = args.current_chapter || "current_chapter";
      const new_chapter_field = args.new_chapter || "new_chapter";
  
  
      console_log(`[component_collate_chapters] [INFO] chapter_name_field = ${chapter_name_field}, current_chapter_field = ${current_chapter_field}, new_chapter_field = ${new_chapter_field}`);
  
      const chunks = await get_json_from_cdn(ctx, chunks_cdn);
  
  
      let chapters = {};
      let chapter_number = 1;
      let summary = "SUMMARY\n=======\n\n";
      let plot = "PLOT POINTS\n===========\n\n";
  
      for (let i = 0; i < chunks.length; i++)
      {
          const chunk_wrapper = chunks[i];
          const chunk = chunk_wrapper.function_arguments;
          console_log(`chunk = ${JSON.stringify(chunk)}`);
  
          const results = collate_chapter_chunk(chapters, chunk, chapter_number, args);
          console_log(`results = ${JSON.stringify(results)}`);
  
          chapters = results.chapters;
          chapter_number = results.chapter_number;
      }
  
      const nb_of_chapters = Object.keys(chapters).length;
      console_log(`Nb of chapters: " + ${Object.keys(chapters).length}`);
      for (let i = 0; i < nb_of_chapters; i++)
      {
          const chapter_key = `chapter_${i + 1}`;
          const chapter = chapters[chapter_key];
          if (chapter)
          {
              let chapter_name = `Chapter ${i + 1}`;
              if (chapter_name_field in chapter) chapter_name += ": " + chapter[chapter_name_field];
  
              summary += chapter_name + "\n";
              if ("summary" in chapter) summary += chapter["summary"] + "\n\n\n"; else summary += "<no summary given>\n\n\n";
  
              plot += chapter_name + "\n";
              if ("plot_points" in chapter) 
              {
                  const plot_point = chapter["plot_points"];
  
                  if (typeof plot_point === "string")
                  {
                      plot += plot_point + "\n";
                  }
                  else if (Array.isArray(plot_point))
                  {
                      for (let j = 0; j < plot_point.length; j++)
                      {
                          plot += plot_point[j] + "\n";
                      }
                      plot += "\n\n";
                  }
                  else
                  {
                      plot += "<no plot points given>\n\n\n";
                  }
              }
          }
      }
  
      const cdn_chapters = await save_json_to_cdn(ctx, chapters);
      const cdn_summary = await save_text_to_cdn(ctx, summary);
      const cdn_plot = await save_text_to_cdn(ctx, plot);
  
      console.timeEnd("processTime");
      return { chapters: cdn_chapters, summary: cdn_summary, plot: cdn_plot };
  
  }
   
export {CollateChaptersComponent};
    