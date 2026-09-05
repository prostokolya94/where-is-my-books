import { Controller, Get } from '@nestjs/common';
import { ReadService } from './read.service';

@Controller('read')
export class ReadController {
  constructor(private readonly service: ReadService) {}

  @Get()
  getOverview() {
    return this.service.getOverview();
  }
}
