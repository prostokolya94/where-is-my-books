import { Controller, Get } from '@nestjs/common';
import { FlagsService } from './flags.service';
import { Public } from '../auth/public.decorator';

@Controller('flags')
export class FlagsController {
  constructor(private readonly flags: FlagsService) {}

  @Public()
  @Get()
  list() {
    return this.flags.list();
  }
}