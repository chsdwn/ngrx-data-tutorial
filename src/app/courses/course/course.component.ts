import { AfterViewInit, Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Course } from '../model/course';
import { Observable, of } from 'rxjs';
import { Lesson } from '../model/lesson';
import { concatMap, delay, filter, first, map, shareReplay, tap, withLatestFrom } from 'rxjs/operators';
import { CoursesHttpService } from '../services/courses-http.service';
import { CourseEntityService } from '../services/course-entity.service';
import { LessonEntityService } from '../services/lesson-entity.service';


@Component({
  selector: 'course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.css'],
  // Only updates UI when data changes. Don't use if component has many subscription. Use for ngrx data
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseComponent implements OnInit {
  course$: Observable<Course>;
  lessons$: Observable<Lesson[]>;
  loading$: Observable<boolean>;
  displayedColumns = ['seqNo', 'description', 'duration'];
  nextPage = 0;

  constructor(
    private courseEntityService: CourseEntityService,
    private lessonEntityService: LessonEntityService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    const courseUrl = this.route.snapshot.paramMap.get('courseUrl');
    this.course$ = this.courseEntityService.entities$
      .pipe(
        map(courses => courses.find(course => course.url === courseUrl))
      );
    this.lessons$ = this.lessonEntityService.entities$
      .pipe(
        withLatestFrom(this.course$),
        tap(([lessons, course]) => {
          if (this.nextPage === 0) {
            this.loadLessonsPage(course);
          }
        }),
        map(([lessons, course]) => {
          return lessons.filter(lesson => lesson.courseId === course.id);
        })
      );
    this.loading$ = this.lessonEntityService.loading$.pipe(delay(0));
  }

  loadLessonsPage(course: Course) {
    this.lessonEntityService.getWithQuery({
      'courseId': course.id.toString(),
      'pageNumber': this.nextPage.toString(),
      'pageSize': '3'
    });
    this.nextPage += 1;
  }
}
