import {
  Controller,
  UseGuards,
  Get,
  Body,
  Post,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LibraryService } from './library.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateLibraryEntryDto } from './dto/create-library-entry.dto';
import { UpdateLibraryEntryDto } from './dto/update-library-entry.dto';
import { ListLibraryDto } from './dto/list-library.dto';

@Controller('me/library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }, @Query() query: ListLibraryDto) {
    return this.libraryService.findAll(user.id, query);
  }

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateLibraryEntryDto,
  ) {
    return this.libraryService.create(user.id, dto);
  }

  @Patch(':gameId')
  update(
    @CurrentUser() user: { id: string },
    @Param('gameId', ParseIntPipe) gameId: number,
    @Body() dto: UpdateLibraryEntryDto,
  ) {
    return this.libraryService.update(user.id, gameId, dto);
  }

  @Delete(':gameId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: { id: string },
    @Param('gameId', ParseIntPipe) gameId: number,
  ) {
    await this.libraryService.remove(user.id, gameId);
  }
}
