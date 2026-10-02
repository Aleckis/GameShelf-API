import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { GamesService } from './games.service';
import { ListGamesDto } from './dto/list-games.dto';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
findAll(@Query() query: ListGamesDto) {
  return this.gamesService.findAll(query);
}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
  return this.gamesService.findOne(id);
}
}