// ReadTextFilesComponent.js

import { is_valid, console_log, rebuildToTicketObjectsIfNeeded, parse_text_to_array } from './utils.js';

var ReadTextFileComponent = {
  schema:
  {
    "tags": ['default'],
    "componentKey": "readTextFiles",
    "category": "Document Processing",
    "operation": {
      "schema": {
        "title": "Read Text Files",
        "type": "object",
        "required": [],
        "properties": {
          "text_or_url": {
            "title": "text or url(s) of text files",
            "type": "string",
            "x-type": "text",
            'description': 'url or JSON list of urls',
          },
        }
      },
      "responseTypes": {
        "200": {
          "schema": {
            "title": "JSON",
            "required": [],
            "type": "object",
            "properties": {
              "documents": {
                "title": "Documents",
                "type": "array",
                "x-type": "documentArray",
                "description": `Read documents`,
              },
            },
          },
          "contentType": "application/json"
        },
      },
      "method": "X-CUSTOM"
    },
    patch:
    {
      "title": "Read text files",
      "category": "Text Manipulation",
      "summary": "Read text files",
      "meta": {
        "source": {
          "summary": "Read text files",
        },
      },
    },
  },
  functions: {
    _exec: async (payload, ctx) =>
    {
      const text_or_url = payload.text_or_url;
      const documents = await read_text_file_component(ctx, text_or_url);
      return { result: { "ok": true }, documents: documents };
    }
  }
};

async function read_text_file_component(ctx, url_or_text)
{
    const returned_documents = [];

    console_log(`[read_text_file_component] url_or_text = ${url_or_text}`);
    if (is_valid(url_or_text))
    {
        console.time("read_text_file_component_processTime");


        console_log(`--------------------------------`);

        const parsedArray = parse_text_to_array(url_or_text);
        console_log(`[read_text_file_component] parsedArray #  ${parsedArray.length}`);

        const cdn_tickets = rebuildToTicketObjectsIfNeeded(parsedArray);
        console_log(`[read_text_file_component] cdn_tickets #  ${cdn_tickets.length}`);

        if (cdn_tickets.length > 0)
        {
            // The parsedArray contains CDN tickets, return them as is.
            for (let i = 0; i < cdn_tickets.length; i++)
            {
                const cdn_ticket = cdn_tickets[i];
                returned_documents.push(cdn_ticket);
            }
        } else if (parsedArray.length === 1 && typeof parsedArray[0] === 'string')
        {
            // The parsedArray contains a single text string, save it to the CDN and return the ticket.
            const individual_text = parsedArray[0];
            const buffer = Buffer.from(individual_text);
            const document_cdn = await ctx.app.cdn.putTemp(buffer, { mimeType: 'text/plain; charset=utf-8', userId: ctx.userId });

            returned_documents.push(document_cdn);
        } else
        {
            // The parsedArray contains URLs, rebuild them into tickets and return as an array.
            for (let i = 0; i < cdn_tickets.length; i++)
            {
                const cdn_ticket = cdn_tickets[i];
                returned_documents.push(cdn_ticket);
            }
        }

        if (is_valid(returned_documents) == false) throw new Error(`ERROR: could not convert to documents`);
        console_log(`[read_text_file_component] documents # = ${returned_documents.length}`);
        console_log(`[read_text_file_component] documents = ${JSON.stringify(returned_documents)}`);

        console.timeEnd("read_text_file_component_processTime");
    }
    return returned_documents;
}


export { ReadTextFileComponent, read_text_file_component };
