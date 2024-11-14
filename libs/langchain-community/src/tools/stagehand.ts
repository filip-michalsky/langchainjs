import { Tool, type ToolParams, BaseToolkit as Toolkit, ToolInterface } from "@langchain/core/tools";
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

//  Documentation is here:
//  https://js.langchain.com/docs/integrations/tools/stagehand

export class StagehandToolkit extends Toolkit {
  tools: ToolInterface[];
  stagehand?: Stagehand;

  constructor(stagehand?: Stagehand) {
    super();
    this.stagehand = stagehand;
    this.tools = this.initializeTools();
  }

  private initializeTools(): ToolInterface[] {
    return [
      new StagehandNavigateTool(this.stagehand),
      new StagehandActTool(this.stagehand),
      new StagehandExtractTool(this.stagehand),
      new StagehandObserveTool(this.stagehand),
    ];
  }

  static async fromStagehand(stagehand: Stagehand): Promise<StagehandToolkit> {
    return new StagehandToolkit(stagehand);
  }
}

export class StagehandNavigateTool extends Tool {
  name = "stagehand_navigate";
  description = "Use this tool to navigate to a specific URL using Stagehand. The input should be a valid URL as a string.";
  private stagehand?: Stagehand;
  private localStagehand?: Stagehand;

  constructor(stagehandInstance?: Stagehand) {
    super();
    this.stagehand = stagehandInstance;
  }

  private async getStagehand(): Promise<Stagehand> {
    if (this.stagehand) return this.stagehand;

    if (!this.localStagehand) {
      this.localStagehand = new Stagehand({
        env: "LOCAL",
        enableCaching: true,
      });
      await this.localStagehand.init();
    }
    return this.localStagehand;
  }

  async _call(input: string): Promise<string> {
    const stagehand = await this.getStagehand();
    try {
      await stagehand.page.goto(input);
      return `Successfully navigated to ${input}.`;
    } catch (error) {
      return `Failed to navigate to ${input}: ${error.message}`;
    }
  }
}

export class StagehandActTool extends Tool {
  name = "stagehand_act";
  description = "Use this tool to perform an action on the current web page using Stagehand. The input should be a string describing the action to perform.";
  private stagehand?: Stagehand;
  private localStagehand?: Stagehand;

  constructor(stagehandInstance?: Stagehand) {
    super();
    this.stagehand = stagehandInstance;
  }

  private async getStagehand(): Promise<Stagehand> {
    if (this.stagehand) return this.stagehand;
    
    if (!this.localStagehand) {
      this.localStagehand = new Stagehand({
        env: "LOCAL",
        enableCaching: true,
      });
      await this.localStagehand.init();
    }
    return this.localStagehand;
  }

  async _call(input: string): Promise<string> {
    const stagehand = await this.getStagehand();
    const result = await stagehand.act({ action: input });
    if (result.success) {
      return `Action performed successfully: ${result.message}`;
    } else {
      return `Failed to perform action: ${result.message}`;
    }
  }
}

export class StagehandExtractTool extends Tool {
  name = "stagehand_extract";
  description = "Use this tool to extract structured information from the current web page using Stagehand. The input should be a JSON string with 'instruction' and 'schema' fields.";
  private stagehand?: Stagehand;
  private localStagehand?: Stagehand;

  constructor(stagehandInstance?: Stagehand) {
    super();
    this.stagehand = stagehandInstance;
  }

  private async getStagehand(): Promise<Stagehand> {
    if (this.stagehand) return this.stagehand;
    
    if (!this.localStagehand) {
      this.localStagehand = new Stagehand({
        env: "LOCAL",
        enableCaching: true,
      });
      await this.localStagehand.init();
    }
    return this.localStagehand;
  }

  async _call(input: string): Promise<string> {
    const stagehand = await this.getStagehand();

    let parsedInput;
    try {
      parsedInput = JSON.parse(input);
    } catch (error) {
      return `Invalid input. Please provide a JSON string with 'instruction' and 'schema' fields.`;
    }

    const { instruction, schema } = parsedInput;

    if (!instruction || !schema) {
      return `Input must contain 'instruction' and 'schema' fields.`;
    }

    try {
      const result = await stagehand.extract({
        instruction,
        schema: z.object(schema)
      });
      return JSON.stringify(result);
    } catch (error) {
      return `Failed to extract information: ${error.message}`;
    }
  }
}

export class StagehandObserveTool extends Tool {
  name = "stagehand_observe";
  description = "Use this tool to observe the current web page and retrieve possible actions using Stagehand. The input can be an optional instruction string.";
  private stagehand?: Stagehand;
  private localStagehand?: Stagehand;

  constructor(stagehandInstance?: Stagehand) {
    super();
    this.stagehand = stagehandInstance;
  }

  private async getStagehand(): Promise<Stagehand> {
    if (this.stagehand) return this.stagehand;
    
    if (!this.localStagehand) {
      this.localStagehand = new Stagehand({
        env: "LOCAL",
        enableCaching: true,
      });
      await this.localStagehand.init();
    }
    return this.localStagehand;
  }

  async _call(input: string): Promise<string> {
    const stagehand = await this.getStagehand();
    const instruction = input || undefined;

    try {
      const result = await stagehand.observe({ instruction });
      return JSON.stringify(result);
    } catch (error) {
      return `Failed to observe page: ${error.message}`;
    }
  }
}